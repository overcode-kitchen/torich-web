# 티끌모아 태산 (Tickle Moa) - Product Requirements Document (PRD)

> **버전**: 1.1  
> **최종 수정일**: 2025-01-15  
> **작성 기준**: 현재 코드베이스 분석 (실제 구현 상태 반영)

---

## 1. 서비스 개요

### 1.1 서비스명
- **앱 내부명**: 티끌모아 태산
- **랜딩 브랜드**: 토리치 (비로그인 시)
- **캐릭터**: 토리 (🐿️ 다람쥐)

### 1.2 한 줄 요약
**매달 꾸준히 적립 투자했을 때, N년 뒤 얼마가 될지 복리로 계산해 보여주는 개인 투자 시뮬레이터 및 납입 관리 플랫폼**

### 1.3 핵심 가치 제안
- 막연한 부자의 꿈을 **숫자로 확인**
- **10초 만에** 복리 계산 결과 확인
- **현실적인 자산 목표** 제시 (희망 고문 지양)
- **매월 투자일 알림·납입 관리**로 꾸준한 투자 습관 지원

### 1.4 타깃 사용자
- 월급의 일부를 꾸준히 적립·투자하는 직장인
- 복리 효과를 직관적으로 이해하고 싶은 사람
- 여러 투자(주식, ETF 등)를 한 곳에서 관리하고 싶은 사람

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 스타일 | Tailwind CSS 4, tw-animate-css |
| DB·Auth | Supabase |
| 차트 | Recharts |
| 금융 데이터 | Yahoo Finance (yahoo-finance2) |
| 날짜 처리 | date-fns (한국어 로케일 `ko`) |
| UI 컴포넌트 | Radix UI (Dropdown, AlertDialog, Popover 등), Shadcn UI |
| 날짜 선택 | react-day-picker, DateRangePicker (@ss-components/date-picker-02 기반) |
| 아이콘 | Tabler Icons, Lucide React |

---

## 3. 인증 및 데이터

### 3.1 인증
- **Google OAuth** (Supabase Auth)
- **테스트 계정** (개발 환경 `NODE_ENV=development`): `test@test.com` / `password1234`
- **콜백**: `/auth/callback` → `exchangeCodeForSession` → `/`
- **에러 처리**: 인증 실패 시 `/auth/auth-code-error` 페이지로 리다이렉트

### 3.2 데이터 저장 (Supabase)

| 테이블 | 용도 |
|--------|------|
| `records` | 투자 기록 (user_id, title, symbol, monthly_amount, period_years, annual_rate, final_amount, start_date, investment_days, is_custom_rate, rate_updated_at 등) |
| `stocks` | 종목 검색용 (symbol, name, group, market) |

### 3.3 records 스키마 (실제 사용 필드)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | FK (auth.users) |
| title | string | 종목명 |
| symbol | string? | Yahoo Finance 심볼 (검색 선택 시만) |
| monthly_amount | number | 월 투자금(원) |
| period_years | number | 목표 기간(년) |
| annual_rate | number | 연 수익률(%) |
| final_amount | number | 만기 예상 금액 |
| start_date | date | 투자 시작일 |
| investment_days | number[]? | 매월 투자일 (예: [5, 25]) |
| is_custom_rate | boolean | 수익률 직접 입력/수정 여부 |
| rate_updated_at | timestamp? | 수익률 마지막 갱신일 (자동 갱신용) |
| created_at | timestamp | 생성일 |

### 3.4 localStorage 상태 저장

| 키 패턴 | 값 | 용도 |
|---------|-----|------|
| `torich_completed_{id}_{YYYY-MM}_{day}` | ISO 8601 일시 | 납입 완료 기록 |
| `torich_notification_{id}` | `"1"` / `"0"` | 종목별 알림 ON/OFF |
| `torich_notification_global` | `"1"` / `"0"` | 전체 알림 ON/OFF |

---

## 4. 화면 및 기능 상세

### 4.1 레이아웃 및 네비게이션

| 항목 | 스펙 |
|------|------|
| **AppLayout** | `HIDE_NAV_PATHS`: `/login`, `/add`, `/auth` 및 하위 경로에서 네비게이션 숨김 |
| **하단 패딩** | 네비 표시 시 `pb-20` |
| **BottomNavigation** | 홈(/), 통계(/stats), 캘린더(/calendar), 설정(/settings) 4탭 |
| **활성 탭** | `text-brand-600` 색상 |

### 4.2 랜딩 페이지 (비로그인)

- **경로**: `/` (user 없을 때)
- **구성**: 토리치 로고, 설명 카드("매달 꾸준히 적립하면 10년 뒤엔 얼마가 될까요?"), 토리 이미지
- **CTA**: "계산기 두드려보기" → `/add`, "로그인" → `/login`
- **오타**: "이미 람쥐이신가요?" (현재 코드 기준)

### 4.3 로그인 페이지 (`/login`)

- **Google 로그인**: OAuth → 웹은 `/auth/callback`, 네이티브 앱은 `torich://auth/callback` (딥링크로 앱 복귀 후 세션 교환). Supabase Redirect URLs에 `torich://**` 추가 필요 → [NATIVE_OAUTH_REDIRECT.md](./NATIVE_OAUTH_REDIRECT.md)
- **테스트 계정**: 개발 환경에서만 "테스트 계정으로 입장" 버튼 표시
- **뒤로가기**: `router.back()`

### 4.4 투자 등록 (`/add`)

| 항목 | 설명 |
|------|------|
| **진입 경로** | 랜딩 "계산기 두드려보기" / 로그인 후 "투자 목록 추가하기" |
| **인증** | 비로그인 시 `/login`으로 리다이렉트 |
| **마켓 선택** | 🇰🇷 국내 주식(KR) / 🇺🇸 미국 주식(US) 탭 |
| **종목 입력** | 2글자 이상 입력 시 Debounce(500ms) 후 `/api/search?query=&market=` 검색 |
| **직접 입력** | 검색 결과 없을 때 "직접 입력하기" → 종목명 + 예상 수익률 입력 |
| **수익률** | 검색 선택 시 `/api/stock?symbol=` → Yahoo Finance 10년 CAGR 자동 적용 |
| **수익률 상한** | CAGR 최대 20% |
| **입력 필드** | 월 투자금(만원), 투자 기간(년), 투자 시작일(DatePicker), 매월 투자일(InvestmentDaysPickerSheet) |
| **필수** | 매월 투자일 필수 선택 (알림용) |
| **저장** | Supabase `records` 테이블에 `user_id`, `title`, `symbol`, `monthly_amount`, `period_years`, `annual_rate`, `final_amount`, `start_date`, `investment_days`, `is_custom_rate` 저장 |

### 4.5 대시보드 (로그인 후 `/`)

#### 상단 배너 (2장 가로 스크롤)
- **배너 1**: N년 뒤 예상 자산 (1/3/5/10/30년 드롭다운), 만기 안내(클릭 시 CashHoldItemsSheet), 월 납입 pill(클릭 시 MonthlyContributionSheet)
- **배너 2**: "2번째 배너입니다." (플레이스홀더)
- **페이지네이션**: 우측 상단 점 2개

#### 다가오는 투자 (UpcomingInvestments)
- **기간 선택**: 프리셋(오늘, 3일, 7일, 보름, 한달, 1년) + 기간 선택(DateRangePicker)
- **기본값**: 프리셋 7일, 기간 선택 시 오늘~7일 후
- **완료하기**: 클릭 시 localStorage 저장 후 목록에서 제거
- **되돌리기**: 완료 후 5초간 토스트("완료됨" + "되돌리기" 버튼)

#### 이번 달 현황 카드
- "이번 달 납입: N건 중 M건 완료" → `/stats` 링크

#### 내 투자 목록
- **필터**: 전체 / 진행 중 / 종료
- **정렬**: 평가금액 순 / 월 투자액 순 / 이름 순 / 다음 투자일 순
- **클릭**: InvestmentDetailView (풀페이지)

#### 예상 수익 차트 (AssetGrowthChart)
- **타입**: 스택형 막대 차트 (Recharts BarChart)
- **마일스톤**: 1년, 3년, 5년, 10년, 최종 만기
- **막대**: 원금(green-100) + 수익금(브랜드 그라데이션)
- **토리 메시지**: "복리 효과로 +N만원이 자라났어요"
- **인터랙션**: 막대 클릭 시 상세(원금, 수익, 수익률%)

#### 수익률 자동 갱신
- 로그인 시 `GET /api/update-user-rates?userId=`로 갱신 필요 여부 확인
- 필요 시 `POST /api/update-user-rates` 호출 → `is_custom_rate=false`이고 `rate_updated_at < 지난달 말일`인 레코드만 Yahoo Finance CAGR로 갱신
- 갱신 완료 시 토스트: "지난달 시장 데이터를 반영하여 예측을 업데이트했어요!"

### 4.6 투자 상세 (InvestmentDetailView)

| 항목 | 설명 |
|------|------|
| **헤더** | 뒤로가기, 종목별 알림 토글, 더보기(수정/삭제) |
| **스크롤 시** | 큰 종목명이 뷰포트 밖으로 나가면 헤더에 작은 종목명 고정 표시 |
| **콘텐츠** | 종목명, 상태("목표 달성! 🎉" / "N년 Y개월째 도전 중 🔥"), 진행률 바 |
| **투자 정보** | 월 투자금, 목표 기간, 연 수익률, 매월 투자일, 총 원금, 예상 수익, 만기 시 예상 금액 |
| **월별 납입 기록** | 시작일부터 오늘까지, 기본 6개월 표시, "이어서 보기" 클릭 시 10개월씩 추가 로드 |
| **완료 판정** | 해당 월의 **모든 납입일**이 완료된 경우에만 "✓ 완료됨" |
| **수정** | InvestmentEditSheet, InvestmentDaysPickerSheet |
| **삭제** | AlertDialog 확인 후 Supabase 삭제 |

### 4.7 통계 페이지 (`/stats`)

| 섹션 | 설명 |
|------|------|
| **이번 달 납입 현황** | N건 중 M건 완료, 프로그레스 바 |
| **기간별 완료율** | 프리셋(이번 달, 최근 3/6/12개월) + 기간 선택(DateRangePicker) |
| **기본값** | 프리셋 "최근 6개월", 기간 선택 시 "7일 전~오늘" |
| **완료율 %** | 선택 기간 내 월별 완료율 평균 |
| **월별 차트** | Recharts BarChart, 월별 완료율 막대 |
| **총 납입 금액** | 선택 기간 내 완료된 납입액 합산, 월평균 표시 |

### 4.8 캘린더 페이지 (`/calendar`)

| 항목 | 설명 |
|------|------|
| **월 네비게이션** | 이전/다음 월 이동 |
| **캘린더 그리드** | 일별 마커: 완료(초록), 미완료/지남(빨강), 예정(회색) |
| **날짜 선택** | 해당 날짜 예정 투자 목록 표시 |
| **완료하기** | 클릭 시 localStorage 저장 |

### 4.9 설정 페이지 (`/settings`)

| 섹션 | 내용 |
|------|------|
| **알림** | 전체 알림 ON/OFF 토글 (localStorage) |
| **계정** | 로그인 이메일, 로그아웃 |
| **앱 정보** | 버전 1.0.0, 문의하기(mailto:support@torich.app), 이용약관(#), 개인정보처리방침(#) |

### 4.10 바텀 시트

| 시트 | 트리거 | 내용 |
|------|--------|------|
| **CashHoldItemsSheet** | "만기가 지난 상품은 현금으로 보관" 클릭 | 선택 기간보다 만기 짧은 항목, 만기 시점 평가금액 |
| **MonthlyContributionSheet** | "월 N만원씩 투자 중" 클릭 | 총 월 납입액, 종목별 금액·비중 |
| **InvestmentDaysPickerSheet** | 상세/추가 화면 "매월 투자일" | 1~31일 그리드, 다중 선택 |

---

## 5. API

| 엔드포인트 | 메서드 | 용도 |
|------------|--------|------|
| `/api/search` | GET | 종목 검색 (`query`, `market`: KR/US) |
| `/api/stock` | GET | 종목 상세 (`symbol`) → 10년 CAGR, 현재가 |
| `/api/update-user-rates` | GET | 갱신 필요 여부 확인 (`userId`) |
| `/api/update-user-rates` | POST | 수익률 일괄 갱신 (`userId`) |

---

## 6. 핵심 계산 로직

### 6.1 복리 공식 (기납입액 기준 월복리)
```
FV = PMT × ((1+r)^n - 1) / r × (1+r)
```
- PMT: 월 납입액
- r: 월 이율 (연이율/12)
- n: 총 개월 수

### 6.2 만기 이후 (Cash Hold)
- 사용자 선택 기간(T) > 개별 투자 만기(P)인 경우
- P년까지 복리 계산 후, (T-P)년 동안 **이자 없이 현금 보관**으로 가정

### 6.3 수익률 출처
- **시스템**: Yahoo Finance 과거 10년 월봉 → CAGR (지난달 말일 기준, KST)
- **직접 입력**: 사용자 입력값
- **안전장치**: CAGR 최대 20% 상한

---

## 7. 유틸리티 함수

### 7.1 `app/utils/date.ts`
- `getUpcomingPayments`, `getUpcomingPaymentsInRange` (날짜 범위 지원)
- `getNextPaymentDate`, `formatPaymentDateShort`
- `calculateEndDate`, `getElapsedText`, `getRemainingText`, `calculateProgress`
- `isCompleted`, `getDaysUntilNextPayment`

### 7.2 `app/utils/payment-history.ts`
- `getPaymentHistory` (최근 N개월)
- `getPaymentHistoryFromStart` (시작일부터, 페이징 지원)
- 월별 완료 판정: 해당 월의 **모든 납입일**이 완료되어야 `completed: true`

### 7.3 `app/utils/stats.ts`
- `getThisMonthStats`, `getPeriodTotalPaid`, `getPeriodTotalPaidForRange`
- `getMonthlyCompletionRates`, `getMonthlyCompletionRatesForRange`
- `getPaymentEventsForMonth`, `isPaymentEventCompleted`

### 7.4 `app/utils/finance.ts`
- `generateAssetGrowthData`, `generatePortfolioGrowthData`
- `getMilestoneChartData`, `getMilestoneYears`
- `findGoldenCrossPoint`

### 7.5 `lib/utils.ts`
- `formatCurrency`: 억/만원 단위 포맷 (소수점 제거)

---

## 8. 화면 플로우

```
[랜딩] → 계산기 두드려보기 → /add (비로그인 시 /login 리다이렉트)
       → 로그인 → /login → Google OAuth → /auth/callback → /

[로그인 후]
/ (대시보드)
  ├─ 배너: 예상 자산, 만기 안내, 월 납입 pill
  ├─ 다가오는 투자 (완료하기, 되돌리기)
  ├─ 투자 목록 추가하기 → /add
  ├─ 이번 달 현황 → /stats
  ├─ 예상 수익 차트 (스택 막대)
  └─ 내 투자 목록
       └─ 아이템 클릭 → InvestmentDetailView (풀페이지)
            ├─ 수정 → 저장
            └─ 삭제

/stats (통계)
/calendar (캘린더)
/settings (설정)
```

---

## 9. 용어 및 UI 일관성

| 용어 | 용도 |
|------|------|
| **완료하기** | 납입 완료 액션 버튼 |
| **✓ 완료됨** | 이미 완료된 상태 표시 |
| **완료됨** | 토스트 메시지 (되돌리기와 함께) |

---

## 10. Out of Scope (현재 미구현)

- 실제 푸시 알림/이메일 발송
- 알림 설정 서버 저장 (현재 localStorage만)
- 월별 납입 기록 테이블 내 [완료] 버튼
- 다국어/다른 로케일 확장

---

## 11. 향후 고려 사항

- 배너 2 콘텐츠 확정
- CRON 수익률 갱신 스케줄 (현재 로그인 시 클라이언트 트리거)
- GA 이벤트 활성화 (`sendGAEvent` 주석 처리됨)
- 모바일 최적화 (max-w-md 기준)
- 이용약관, 개인정보처리방침 실제 링크 연결
