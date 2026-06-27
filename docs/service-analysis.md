# 토리치(Torich) 서비스 전체 분석

> 매달 투자, 까먹지 않게 — 적립식 투자 알림·납입 관리 서비스
>
> 이 문서는 코드베이스 전체를 영역별로 분석한 **마스터 개요**다. 세부 규칙은 `docs/` 하위 개별 문서를 참조한다.
> 작성 기준일: 2026-06-25 · 버전 1.1.0

---

## 0. 한눈에 보기

| 항목 | 내용 |
|------|------|
| **무엇** | 적립식 투자 알림 + 납입 체크 + 투자 현황 통계 + 목표 관리 + 게이미피케이션(토리 키우기) |
| **플랫폼** | 웹(`torich.vercel.app`) + iOS 앱(App Store, Capacitor 정적 번들) |
| **기술 스택** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Capacitor · Firebase(FCM) |
| **데이터 접근** | 클라이언트가 Supabase SDK로 DB 직접 접근 → **스키마가 곧 API** |
| **규모** | `app/` 내 TS/TSX 321개, 컴포넌트 152개, 커스텀 훅 105개, 마이그레이션 9개, Edge Function 5개 |
| **배포** | 웹=Vercel 자동 / iOS=`build:app` → Capacitor sync → Xcode → App Store |

### 핵심 설계 제약 (반드시 인지)
1. iOS 앱은 **로컬 정적 번들**(`output: 'export'`, `webDir: 'out'`) → 빌드 시점에 prebuild 안 된 경로는 운영 앱에서 404.
2. 운영 중 항상 **`구버전 앱 + 신버전 DB/API`** 조합 존재 → 스키마/API Breaking Change 금지.
3. 동적 세그먼트(`[id]`) 신규 추가 금지 → **정적 경로 + query param**(`/goal/detail?id=`) 패턴.

상세: [CLAUDE.md](../CLAUDE.md), [docs/architecture.md](architecture.md)

---

## 1. 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                          클라이언트                                │
│  ┌────────────────────┐         ┌────────────────────────────┐   │
│  │   웹 (Vercel SSR)   │         │  iOS 앱 (Capacitor WebView) │   │
│  │   torich.vercel.app │         │  out/ 정적 번들 로드        │   │
│  └─────────┬──────────┘         └──────────┬─────────────────┘   │
│            │  Next.js App Router / React 19 / 105 커스텀 훅        │
│            │  AuthProvider→ThemeProvider→NotificationProvider→     │
│            │  InvestmentsProvider                                  │
└────────────┼───────────────────────────────┼─────────────────────┘
             │ Supabase SDK (직접 접근)        │ NEXT_PUBLIC_API_URL
             ▼                                ▼ (앱→웹 API 호출)
┌────────────────────────────┐   ┌───────────────────────────────┐
│        Supabase            │   │   Next.js API Routes (웹만)    │
│  · PostgreSQL + RLS        │   │  /api/stock     (Yahoo Finance)│
│  · Auth (Google/Apple)     │   │  /api/search    (종목 검색)    │
│  · Edge Functions (5개)    │   │  /api/update-user-rates (CAGR) │
│  · DB Webhooks + pg_cron   │   │  /api/delete-account           │
└──────────┬─────────────────┘   └───────────────────────────────┘
           │ FCM
           ▼
   ┌───────────────┐    외부 의존성: Yahoo Finance(주가) · GA4(분석)
   │ Firebase 푸시 │
   └───────────────┘
```

### 전역 프로바이더 스택 ([app/layout.tsx](../app/layout.tsx))
```
AuthProvider              사용자 세션 (Supabase onAuthStateChange)
 └ ThemeProvider          라이트/다크/시스템 (user_settings.theme 동기화)
    └ NotificationProvider FCM 권한 + 푸시 리스너 (네이티브 전용)
       └ InvestmentsProvider 투자/예적금/현금 데이터 (records)
          └ AppLayout      하단 탭바 + SafeArea
```
부가: `InvestmentTabContext`(투자 상세 탭 상태), `AuthDeepLinkHandler`(네이티브 OAuth 콜백), `Toaster`(Sonner), `GoogleAnalytics`.

---

## 2. 데이터 모델

클라이언트가 Supabase에 직접 접근하므로 **스키마 = API**. 타입은 [types/database.types.ts](../types/database.types.ts) 가 단일 진실.

### ERD (핵심 엔티티)
```
auth.users (1) ──┬── (N) records ──────── (N:1) goals
                 │       │  └ (N) payment_history
                 │       │         └ (N) scheduled_notifications
                 │       └ (N) scheduled_notifications
                 ├── (1) user_settings
                 ├── (N) user_push_tokens
                 └─ ...
stocks (마스터)            service_announcements ── (N) scheduled_notifications
```

### 주요 테이블
| 테이블 | 의미 | 핵심 컬럼 |
|--------|------|-----------|
| **records** | 적립/투자 항목(투자·예적금·현금) | `monthly_amount`, `unit_type`(amount/shares), `monthly_shares`, `period_years`(NULL=적립형), `annual_rate`, `is_custom_rate`, `investment_days[]`, `record_type`, `interest_rate`, `maturity_date`, `goal_id`, `market`(KR/US), `settled_at` |
| **payment_history** | 실제 납입 기록(월 단위) | `record_id`, `payment_date`, `completed_at`, `is_retroactive`(소급 여부), `captured_shares`, `captured_price`(시세 캡처) |
| **goals** | 투자 목표(Goal-Based Investing) | `target_amount`, `target_date`, `external_amount`(외부 기여금), `emoji`, `completed_at`, `archived_at` |
| **scheduled_notifications** | 예약 알림 큐 | `record_id`/`goal_id`, `token`, `scheduled_at`, `notification_type`(reminder/re_reminder/service_announcement), `status`(pending/sent/failed) |
| **user_settings** | 알림/UI 설정 | `notification_global_enabled`, `notification_default_time`, `notification_pre_reminder`, `notification_re_reminder_enabled`, `notification_skip_weekend_holiday`, `theme` |
| **user_push_tokens** | FCM 토큰 | `token`, `platform`, `device_id` |
| **stocks** | 종목 마스터 | `symbol`, `name`, `market` |
| **service_announcements** | 공지사항 | `title`, `body` |

### 두 가지 투자 모드 (핵심 비즈니스 규칙)
- **목표형(Goal Mode)**: `period_years > 0` → 진행률·남은 기간·만기액 계산.
- **적립형(Habit Mode)**: `period_years = null/0` → 무기한, 누적 월수만 표시.

### 마이그레이션 이력 ([supabase/migrations/](../supabase/migrations/))
| 파일 | 변경 | 의도 |
|------|------|------|
| `20260502...skip_weekend_holiday` | user_settings | 주말/공휴일 알림 스킵 |
| `20260505...share_mode` | records: unit_type, monthly_shares | 주수 모드 투자 |
| `20260505...captured_fields` | payment_history: captured_shares/price | 시세 캡처(통계 단일화) |
| `20260507...goals_and_link` | goals(신규)+goal_id | Goal-Based Investing |
| `20260519...record_type` | records: record_type, interest_rate, maturity_date | 예적금/현금 유형 |
| `20260602...settled_at` | records: settled_at | 예적금 만기 정산 |
| `add_is_retroactive` | payment_history | 소급 납입 구분 |
| `add_market` | records: market | KR/US 시장 |
| `allow_null_period_years` | records | 적립형 허용 |

> **호환성 원칙**: 컬럼 삭제·이름변경·타입변경·NOT NULL 추가·RLS 강화 금지. 새 컬럼은 `DEFAULT` 필수. 변경 시 ① 새 구조 추가 → ② 앱 업데이트 배포 확인 → ③ 구 스펙 제거 순서.

---

## 3. 화면(라우트) 맵

| 경로 | 역할 | 네비 탭 |
|------|------|:------:|
| `/` | 홈 대시보드(투자 목록, 다가오는 투자, 목표 카드) | ✅ |
| `/calendar` | 월 캘린더, 납입 일정·완료 체크 | ✅ |
| `/stats` | 통계(예상 자산·수익 차트, 완료율) | ✅ |
| `/settings` | 설정(테마/알림/계정/로그아웃) | ✅ |
| `/add` | 투자·예적금·현금 추가 멀티스텝 폼 | |
| `/investment?id=` | 투자 상세/편집(타입별 분기) | |
| `/goal/new` | 목표 생성(`?preset=`로 프리셋) | |
| `/goal/detail?id=` | 목표 상세·투자 연결 관리 | |
| `/goal/detail/edit?id=` | 목표 편집 | |
| `/tory` | 토리(마스코트) 풀스크린 | |
| `/notifications` | 알림함 | |
| `/settings/notifications` | 알림 세부 설정 | |
| `/settings/privacy`·`/terms` | 개인정보·약관(정적) | |
| `/faq` | FAQ | |
| `/login` · `/auth/callback` · `/auth/auth-code-error` | 인증 | |
| `/design-system` | 디자인 시스템 데모(개발) | |

**Query param 패턴**: `?id=`(상세), `?goalId=`(목표 연결 투자 추가), `?editId=&field=`(필드 편집), `?preset=`(목표 프리셋). 정적 export 제약상 동적 세그먼트 대신 사용.

**네비 숨김 경로**: `/login`, `/add`, `/auth`, `/investment`, `/tory`, `/notifications`, `/goal`, `/settings/{notifications,privacy,terms}` ([AppLayout.tsx](../app/components/AppLayout.tsx)).

**뒤로가기**: `useFlowBack({ rootPath, enableHistoryFallback })` — 히스토리 있으면 `router.back()`, 없으면 rootPath로.

---

## 4. 인증 흐름

```
/login ─ useLoginAuth
  ├ Google: signInWithOAuth (웹=리다이렉트 / 네이티브=Browser.open 인앱브라우저)
  ├ Apple : 웹=OAuth / 네이티브=@capacitor-community/apple-sign-in → signInWithIdToken(nonce)
  └ Test  : signInWithPassword (개발 전용)
        ↓
/auth/callback (route.ts) ─ AuthHandler.handleCallback → 세션 교환 → '/' 또는 /auth/auth-code-error
        ↓
AuthProvider.onAuthStateChange → setUser → 페이지 리렌더
```
- 네이티브 딥링크: `torich://login-callback` → AppDelegate → `AuthDeepLinkHandler`.
- PKCE verifier는 Capacitor Preferences에 저장([lib/auth/capacitor-auth-storage.ts](../lib/auth/capacitor-auth-storage.ts)).
- `middleware.ts`는 **CORS만** 담당(인증 리다이렉트는 각 페이지에서 `!user → /login`).
- 상세: [docs/oauth-setup.md](oauth-setup.md)

---

## 5. 도메인 기능

### 5.1 투자 (Investment)
- 종목(KR/US 주식)·월 투자액·기간·수익률·투자일 설정. 금액 모드 / 주수 모드 이원화.
- 수익률: 시스템 자동 조회 또는 직접 입력(`is_custom_rate`).
- 핵심 계산([useInvestmentCalculations](../app/hooks/investment/calculations/useInvestmentCalculations.ts)): 경과월수, 납입원금, 진행률, 만기일, 완료 여부(목표형만).

### 5.2 목표 (Goal)
- 여러 투자를 하나의 목표에 N:1 연결. 외부 기여금(`external_amount`) 포함.
- 진행도([useGoalProgress](../app/hooks/goal/calculations/useGoalProgress.ts)):
  - `실현금액 = 외부자산 + Σ(정산된 예적금 만기액 또는 투자 납입원금)`
  - `예상미래가치 = 실현금액 + Σ(오늘~목표일 추가 적립금, 만기 cap)`
  - `진행률 = min(100, 실현금액 / 목표금액 × 100)`, `D-day = 목표일 - 오늘`

### 5.3 통계 (Stats)
- 예상 자산(1/3/5/10/30년), 예상 수익 막대 차트, 이번 달 납입 현황, 기간별 완료율.
- 복리 시뮬레이션([compound-chart.ts](../app/utils/compound-chart.ts)): `balance = balance × (1 + 월이율) + 월금액`(만기 전), 만기 후 현금 보관.
- 예적금 단리 만기: `interest = (월금액 × 연이율/100/12) × n(n+1)/2`.

### 5.4 캘린더 (Calendar)
- 날짜별 상태: `completed`🟢 / `missed`🔴 / `scheduled`⭕ / 무투자.
- 완료 처리 시 5초 Undo 토스트 + 토리 보상(+10 도토리).

### 5.5 다가오는 투자 (Upcoming)
- 홈 상단 카드(최대 5개, 미완료만). 항목별 "완료하기".

### 5.6 토리 키우기 (게이미피케이션)
- **도토리 경제**: 투자완료 +10 > 출석 +1 (본질 행동 강화). 연속출석 보너스(+5@7일, +30@30일), 월 100% 완료 +20.
- **레벨/칭호/외형**: 누적 도토리(`totalAcorns`) 기준 레벨 1~100+, 7단계 칭호, 5단계 외형.
- **상점**: 모자·안경·의상·배경 아이템(보유 도토리 `balance`로 구매).
- localStorage 영속화(SSR-safe hydration) ([useToryRaisingData](../app/hooks/tory-raising/useToryRaisingData.ts)). 상세: [docs/tori-raising/prd.md](tori-raising/prd.md)

### 5.7 알림·설정·FAQ·온보딩
- 알림함, 알림 세부 설정(시간/사전알림/재알림/공지), 테마, 계정 삭제, FAQ, 3단계 온보딩.

---

## 6. 알림 인프라

Webhook(이벤트 기반 예약) + pg_cron(폴링 발송)의 조합. 상세: [docs/notification-infra.md](notification-infra.md)

| Edge Function | 트리거 | 역할 |
|---------------|--------|------|
| **schedule-notification** | records INSERT/UPDATE Webhook | 납입일 알림 예약 |
| **reschedule-notifications** | user_settings UPDATE Webhook | 설정 변경 시 pending 삭제 후 재예약 |
| **send-announcement** | service_announcements INSERT Webhook | 공지 enabled 유저에 알림 행 삽입 |
| **schedule-re-reminders** | pg_cron 매일 KST 00:10 | 어제 미완료 납입에 당일 재알림 예약 |
| **send-push** | pg_cron 매분 | pending 행 → FCM 발송, 무효 토큰 정리, GA4 이벤트 |

**공통 로직** ([_shared/](../supabase/functions/_shared/)): `notification-schedule.ts`(납입일 행 생성), `korean-holidays.ts`(공휴일 2026~2030 + 영업일 보정), `ga-mp.ts`(GA4 Measurement Protocol).

**중복 방지**: `UNIQUE(record_id, scheduled_at, token)` + `ignoreDuplicates`. 공지는 sentinel record_id(`0000...0001`) 사용.

> Edge Function 변경은 `supabase functions deploy <함수명>` 별도 배포 필요.

---

## 7. 빌드·배포·플랫폼

### 웹 vs 앱 빌드
| | `npm run build` (웹) | `npm run build:app` (iOS) |
|---|---|---|
| 모드 | SSR | 정적 export(`output:'export'`) |
| API 라우트 | 포함 | **제외**(app/api·app/auth 임시 백업) |
| 이미지 | AVIF/WebP | `unoptimized` |
| 필수 env | — | `NEXT_PUBLIC_API_URL` |

**build:app 단계**: ① `verify-app-build-env.mjs`(API_URL 검증) → ② 이전 백업 복구 → ③ app/api·app/auth → `server-routes.backup/` 이동 → ④ `BUILD_TARGET=app next build` → ⑤ 복구.

> ⚠️ 빌드 중단 시 백업 미복구 위험: `mv server-routes.backup/api app/api && mv server-routes.backup/auth app/auth && rm -rf ./server-routes.backup`

### API Routes (웹 전용)
| 경로 | 역할 |
|------|------|
| `GET/POST /api/update-user-rates` | 종목 CAGR 자동 갱신(지난달 말 기준 10년, 20% cap, 시스템 수익률만) |
| `POST /api/delete-account` | 인증 사용자 계정·데이터 삭제 |
| `GET /api/search` | 종목 검색(Supabase stocks) |
| `GET /api/stock` | 종목 CAGR·현재가(Yahoo Finance) |

### iOS 배포
`build:app` → `out/` → `npx cap sync ios` → `ios/App/public/` → Xcode → App Store Connect.
- `webDir: 'out'`, `loggingBehavior: 'production'`, `server.url` **커밋 금지**.
- 한글 경로 + CocoaPods: `LANG/LC_ALL=en_US.UTF-8` 필요.

### 브랜치 전략 ([CONTRIBUTING.md](../CONTRIBUTING.md))
`develop/<name>` → `integration`(PR) → `main`(PR) → Vercel + TestFlight.

### 외부 의존성
Supabase(인증/DB/함수) · Firebase(FCM) · Yahoo Finance(주가) · GA4(분석) · Capacitor 플러그인 스택(app/browser/preferences/push/apple-sign-in 등).

---

## 8. 디자인 시스템

상세: [docs/design-system.md](design-system.md)

### 3-Layer 토큰
- **L1 Primitives**(`brand-*`, `coolgray-*` HSL) — 직접 사용 금지.
- **L2 Semantic**(`globals.css`: `--primary`, `--muted`, `--surface`, `--card`, `--chart-profit`…).
- **L3 Usage**(`bg-primary`, `text-muted-foreground`) — ✅ 권장. hex/`bg-brand-500` ❌.

### 다크모드 ([ThemeProvider](../app/components/ThemeSections/ThemeProvider.tsx))
`light/dark/system` → `getComputedStyle`로 resolve → `documentElement.classList.toggle('dark')`. 라이트↔다크 1:1 매핑. 카드는 배경보다 밝게(Toss 스타일), 다크 카드 보더는 transparent.

### 컴포넌트
- shadcn/ui(`components/ui/`): Button(8 variant: default/secondary/outline/ghost/**soft**/link/destructive), Input(h-12 rounded-xl), Switch, Calendar, TimePicker 등.
- 앱 공용(`app/components/Common/`): AmountInput, PeriodInput, StockSearchInput, DeleteConfirmModal 등.
- 아이콘: @phosphor-icons + @tabler. 3D PNG 17종(`public/icons/3d/`)은 `<Image>` 필수.
- 차트(recharts): 색상은 CSS 변수에서 `getComputedStyle`로 동적 읽기(하드코딩 금지).
- 기본 radius `rounded-xl`, 여유 간격(gap-6/p-6), 본문 16px, H 제목 `tracking-tight`.

---

## 9. 커스텀 훅 아키텍처 (105개)

도메인별 폴더 구성. 네이밍: `use{Domain}Data`(페칭) / `use{Domain}Calculations`(계산) / `use{Feature}`(기능·UI). 대부분 ≤150줄.

| 도메인 | 수 | 책임 |
|--------|---:|------|
| investment | 29 | CRUD, 계산, 추가/편집 폼(코디네이터), 상세 탭, 자동 정산 |
| goal | 10 | 조회/생성/수정/삭제, 진행도, 투자 연결 |
| stock | 7 | 검색, 시세/수익률 조회·캐싱, 수동입력 |
| notification | 6 | 설정, 인박스, FCM 토큰, 토글 |
| auth | 6 | 세션, 로그인, 계정삭제, 네비 |
| tory-raising | 5 | localStorage 상태, 레벨 계산, 패널 |
| payment | 4 | 납입 로드(Map 정규화), 완료/Undo, 페이징 |
| calendar | 4 | 이벤트, 접기, 월 선택 |
| ui · upcoming · chart · platform · stats · 기타 | — | 모달/토스트/스와이프, 예정 납입, 차트, Capacitor 감지 |

### 데이터 패턴
- **Supabase 직접 호출**(~21개 훅), **React Query 미사용** → 수동 `refetch()`.
- **낙관적 업데이트 + Undo**: UI 즉시 반영 → DB 쓰기 → 실패 시 refetch 복구.
- **Map 정규화**: `PaymentHistoryMap = Map<recordId, Set<"YYYY-MM-DD">>` (O(1) 조회).
- **캐싱**: useMemo(계산), localStorage(토리), HTTP 캐시(시세), Context(투자 목록).

### 개선 여지
캐싱 전략 부재(중복 로드), PaymentHistoryMap 이중 구조 복잡성(자동/소급), Supabase 강결합으로 유닛 테스트 어려움.

---

## 10. 위험 포인트 체크리스트 (머지 전)

- [ ] 새 페이지가 `app/**/[*]/` 동적 세그먼트인가 → query param으로 대체?
- [ ] `build:app` 후 `out/`에 모든 진입 경로 HTML 존재?
- [ ] `server-routes.backup/` 잔존 / `app/api`·`app/auth` deleted 상태 아님?
- [ ] `capacitor.config.ts`: `server.url` 주석 + `loggingBehavior: 'production'`?
- [ ] Supabase 스키마/API Breaking Change 없음(구버전 앱 안전)?
- [ ] 마이그레이션 후 `supabase gen types typescript`로 타입 재생성?
- [ ] Edge Function 변경 시 `supabase functions deploy` 완료?

---

## 부록: 관련 문서

| 문서 | 내용 |
|------|------|
| [CLAUDE.md](../CLAUDE.md) | 운영 컨텍스트·호환성·라우팅 정책(CRITICAL) |
| [docs/architecture.md](architecture.md) | 파일 구조·네이밍·훅 패턴 |
| [docs/design-system.md](design-system.md) | 디자인 토큰·다크모드 |
| [docs/coding-style.md](coding-style.md) | 기술 스택 제약·코딩 스타일 |
| [docs/notification-infra.md](notification-infra.md) | 알림 웹훅 + pg_cron 인프라 |
| [docs/oauth-setup.md](oauth-setup.md) | Google/Apple OAuth 설정 |
| [docs/ga4-events.md](ga4-events.md) · [ga4-console-guide.md](ga4-console-guide.md) | GA4 이벤트 설계·콘솔 가이드 |
| [docs/screens.md](screens.md) | 화면별 기능명세 |
| [docs/tori-raising/prd.md](tori-raising/prd.md) | 토리 키우기 PRD |
