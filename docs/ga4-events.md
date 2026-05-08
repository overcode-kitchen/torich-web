# 토리치 GA4 애널리틱스 도입 계획

> **이 문서의 목적**
> 토리치는 지금 서비스 초기입니다. 지금 단계에서 데이터 분석의 목표는 딱 하나입니다.
> **"사람들이 실제로 투자를 등록하고 있는가?"**
>
> GA4를 붙이면 "몇 명이 앱을 켰고, 몇 명이 투자를 등록했고, 몇 명이 다시 돌아왔는지"
> 숫자로 볼 수 있습니다. 이 숫자가 없으면 기능을 개선해도 효과가 있는지 모릅니다.

---

## 목차

1. [현재 상태 — GA가 켜져 있나요?](#1-현재-상태--ga가-켜져-있나요)
2. [GA4 기본 개념 (처음이라면 읽기)](#2-ga4-기본-개념-처음이라면-읽기)
3. [우리가 지킬 규칙](#3-우리가-지킬-규칙)
4. [초기에 봐야 할 지표 5가지 (KPI)](#4-초기에-봐야-할-지표-5가지-kpi)
5. [측정할 이벤트 목록](#5-측정할-이벤트-목록)
6. [퍼널 — "어디서 이탈하는지" 보는 법](#6-퍼널--어디서-이탈하는지-보는-법)
7. [실제 코드 구현 방법](#7-실제-코드-구현-방법)
8. [Capacitor 앱(iOS/Android) 주의사항](#8-capacitor-앱iosandroid-주의사항)
9. [개인정보 관련 체크](#9-개인정보-관련-체크)
10. [GA4 대시보드 초기 세팅](#10-ga4-대시보드-초기-세팅)
11. [구현 순서 체크리스트](#11-구현-순서-체크리스트)
12. [다음 단계 (v2)](#12-다음-단계-v2)

---

## 1. 현재 상태 — 활성화됨 (2026-05-08)

**결론: 추적이 켜져 있고, 운영(Prod) 데이터가 실시간으로 GA로 들어오고 있습니다.**

`app/lib/analytics.ts` 공통 래퍼와 `app/layout.tsx`의 `<GoogleAnalytics />` 마운트가 모두 동작 중이며, 운영/Preview/로컬 환경 모두 `NEXT_PUBLIC_GA_ID`가 주입되어 있습니다. 검증은 Network 탭에서 `collect?v=2&tid=G-SC1LBTD65X` 요청 200/204로 1차 확인 완료.

| 항목 | 상태 |
| --- | --- |
| GA 라이브러리(`@next/third-parties`) | ✅ 설치·마운트 |
| GA 측정 ID | ✅ Dev `G-C8E4VZ883Y` / Prod `G-SC1LBTD65X` |
| Vercel 환경 변수 (Production / Preview) | ✅ 주입 + Redeploy 완료 |
| `.env.local` / `.env.production` | ✅ 각 환경 ID로 분리 주입 |
| `app/hooks/auth/useAuth.ts` `setUserId` 호출 | ✅ 로그인 시 SHA-256 해시된 user_id 자동 설정 |
| 이벤트 호출 코드 | ✅ §5 기준 부착 완료 (인증·투자·납입·알림·통계·온보딩·테마·에러·**목적(Goal)**) |
| 개인정보 처리방침 GA 고지 | ✅ 제1조·제5조에 명시 (`lib/legal/privacy-policy.ko.ts`) |
| iOS 앱 빌드 GA 적용 | ⏳ 다음 출시 빌드부터 적용 (현재 운영 앱은 GA 없는 구버전) |
| `notification_sent` Edge Function 측 송신 | ✅ `supabase/functions/send-push` (Measurement Protocol) |
| GA4 콘솔 — `payment_complete` 전환 마킹 | ⏳ 활성화 후 24h 지나면 너가 직접 토글 (`docs/ga4-console-guide.md` §4 참조) |
| GA4 콘솔 — 활성화 퍼널 / 코호트 보고서 | ⏳ 데이터 1주~1개월 쌓이면 작성 (`docs/ga4-console-guide.md` §5 참조) |

> **운영 가이드는 분리 문서**: 이 문서는 "왜 이 이벤트를 측정하는가"의 기획서입니다. **콘솔에서 어디 클릭해서 어떤 숫자를 봐야 하는지**는 [`docs/ga4-console-guide.md`](./ga4-console-guide.md)를 참조하세요.

---

## 2. GA4 기본 개념 (처음이라면 읽기)

GA4에서는 데이터를 **이벤트(Event)** 단위로 수집합니다.
이벤트는 "사용자가 무언가를 했다"는 신호입니다.

```
사용자가 앱을 켰다          → session_start (자동)
사용자가 페이지를 봤다      → page_view (자동)
사용자가 투자를 등록했다    → investment_create_success (우리가 직접 심어야 함)
```

이벤트에는 **파라미터(Parameter)** 를 붙여서 맥락 정보를 추가할 수 있습니다.

```
investment_create_success
  └── amount_bucket: "100k_500k"   ← 금액 구간
  └── cycle_type: "monthly"        ← 월/주/일 납입
  └── has_rate: true               ← 수익률 설정 여부
  └── platform: "ios"              ← 웹인지 앱인지
```

GA4는 이 이벤트들을 모아서 "몇 명이 이 이벤트를 발생시켰는지", "어떤 단계에서 떠났는지"를 차트로 보여줍니다.

---

## 3. 우리가 지킬 규칙

서비스 초기에 이 규칙을 지키지 않으면 나중에 데이터가 뒤죽박죽이 되어서 분석이 불가능해집니다.

### 규칙 1: 지표는 최소한으로, 하지만 매일 본다

지표를 20개 만들면 아무도 안 봅니다. **KPI는 5개 이내**로 시작합니다.

"매일 본다"는 뜻은 매일 아침 GA4 홈 화면을 **30초만 확인하는 것**입니다. 복잡하게 뜯어보는 게 아닙니다.

> 오늘 신규 유저: 12명 / 투자 등록: 4건 / 어제보다 줄었나?

이 정도만 봐도 됩니다. 숫자가 갑자기 0이 되면 버그 신호이고, 꾸준히 오르면 잘 되고 있는 것입니다. 이 숫자를 보지 않으면 기능을 만들어도 실제로 쓰이는지 모른 채 계속 만드는 상황이 됩니다.

### 규칙 2: 이벤트 이름은 `snake_case` + `동사_목적어` 형식

`snake_case`는 단어 사이를 **밑줄(`_`)로 연결하는 방식**입니다. 밑줄이 뱀이 기어가는 모양 같다고 해서 "snake(뱀)"라는 이름이 붙었습니다.

```
investment_create_success   ← snake_case  (단어들이 _로 이어짐)
investmentCreateSuccess     ← camelCase   (낙타 등처럼 대문자가 솟아있음)
InvestmentCreateSuccess     ← PascalCase
investment-create-success   ← kebab-case  (꼬치처럼 -로 꿰어짐)
```

GA4 이벤트 이름에는 대문자나 `-`를 쓸 수 없어서 `snake_case`를 씁니다. 나중에 팀이 커졌을 때 이름만 봐도 무슨 이벤트인지 알 수 있어야 합니다.

```
✅ 좋은 예: investment_create_success, login_click, notification_open
❌ 나쁜 예: investmentCreated, btn_click, event1
```

### 규칙 3: 개인 정보(PII)는 절대 GA에 보내지 않는다

이메일 주소, 이름, 실제 금액 숫자 등을 GA에 보내면 개인정보법 위반이 될 수 있습니다.
금액은 반드시 아래처럼 **구간(버킷)** 으로 변환해서 보냅니다.

```
✅ 좋은 예: amount_bucket: "100k_500k"  ← 10만~50만 원 구간이라는 뜻
❌ 나쁜 예: amount: 350000              ← 실제 금액 전송 금지
```

### 규칙 4: 측정 ID는 코드에 직접 쓰지 않고 환경변수로 관리 — Dev/Prod 분리

토리치는 두 개의 GA 속성을 운영합니다.

- **Dev 속성** (`Torich Dev`, 측정 ID `G-C8E4VZ883Y`): 로컬 개발(`npm run dev`)·Vercel preview 배포 전용. 개발자/QA의 테스트 활동이 여기로 들어갑니다.
- **Prod 속성** (`Torich Prod`, 측정 ID `G-SC1LBTD65X`): 운영 도메인(`torich.vercel.app`) 웹·앱스토어 빌드 전용. 진짜 사용자 데이터만 들어갑니다.

코드에는 ID를 직접 박지 않고 모두 `NEXT_PUBLIC_GA_ID` 환경변수로 분기합니다. 환경별로 서로 다른 값을 주입하면 같은 코드가 자동으로 다른 속성에 데이터를 보냅니다.

| 환경 | 사용하는 파일/위치 | GA ID |
| --- | --- | --- |
| 로컬 개발 | `.env.local` (gitignore) | `G-C8E4VZ883Y` |
| Vercel Preview | Vercel 대시보드 환경변수 (Preview 환경) | `G-C8E4VZ883Y` |
| Vercel Production | Vercel 대시보드 환경변수 (Production 환경) | `G-SC1LBTD65X` |
| iOS 앱 빌드 | `.env.production` (gitignore — 빌드 머신에 직접 작성) | `G-SC1LBTD65X` |

이 구조 덕분에 출시 후에도 개발자 테스트 행동이 진짜 사용자 KPI에 섞이지 않습니다.

### 규칙 5: 모든 이벤트에 `platform` 파라미터를 반드시 붙인다

토리치는 웹(browser)과 iOS 앱 두 군데서 돌아갑니다. 같은 이벤트라도 플랫폼별로 숫자가 다를 수 있기 때문에, 어디서 발생한 이벤트인지 항상 기록해야 합니다.

```
platform: "web"     ← 브라우저에서 접속한 경우
platform: "ios"     ← 아이폰 앱
platform: "android" ← 안드로이드 앱 (아직 미배포이지만 코드는 미리 준비)
```

**Android 미배포 상황에서의 처리**: 코드는 지금부터 그대로 심어두면 됩니다. `analytics.ts` 래퍼가 `Capacitor.getPlatform()`으로 자동 감지하기 때문에, Android를 출시하는 순간부터 `platform: "android"` 데이터가 자동으로 쌓이기 시작합니다. 지금은 `web`과 `ios` 두 개만 나오다가, 출시 후 세 개로 나뉩니다.

---

## 4. 초기에 봐야 할 지표 5가지 (KPI)

모든 걸 다 볼 필요 없습니다. 활성화하면 아래 5가지만 매일 확인합니다.

> **핵심 관점**: 토리치의 진짜 가치는 "투자를 한 번 등록한다"가 아니라 **"매월 빠지지 않고 납입을 체크하는 습관"**입니다. 그래서 KPI는 등록 이벤트가 아니라 **`payment_complete`(납입 완료)** 를 중심으로 설계합니다.

### KPI 1: 신규 유저 수 (획득)
**"오늘 새로 들어온 사람이 몇 명인가?"**

- 측정 방법: GA4가 자동 수집하는 `first_visit` + 로그인 후 해시된 `user_id` 기반 신규 식별
- 왜 중요한가: 마케팅/바이럴 효과를 확인하는 가장 기본 지표
- **주의**: Capacitor/iOS ITP 환경에서는 `first_visit`이 재방문을 신규로 잘못 카운트할 수 있습니다. **로그인 시 해시된 `user_id`를 GA에 설정하는 것은 활성화 시점의 필수 작업** (§8)이며, user_id 미설정 상태로 켜면 KPI 1 자체가 부정확해집니다.

### KPI 2: 첫 납입 완료율 (활성화 / Aha 모먼트 — 가장 중요)
**"가입한 사람 중 30일 안에 `payment_complete`를 1번이라도 발생시킨 비율은 얼마인가?"**

- 측정 방법: `login_success` 대비 첫 `payment_complete` 비율 (30일 코호트)
- 왜 중요한가: 토리치의 Aha 모먼트는 "투자를 등록한 순간"이 아니라 **"등록한 투자의 첫 납입을 직접 체크/완료한 순간"**입니다. 등록만 하고 한 번도 완료 체크가 없는 유저는 제품 가치를 경험하지 못한 유저입니다. **이 지표가 가장 중요합니다.**
- 목표: 30% 이상 (가설치, 데이터 쌓이면 보정)
- 보조: 7일 내 `investment_create_success` 등록률 — 등록은 완료의 선행 조건이라 함께 모니터링

### KPI 3: 월간 납입 완료 리텐션 (M1 ~ M6, 한 달 단위 전체)
**"첫 납입 완료를 한 유저가 1개월/2개월/3개월/4개월/5개월/6개월 뒤에도 매달 납입 완료를 했는가?"**

- 측정 방법: 첫 `payment_complete` 발생 월을 코호트 M0로 잡고, **M1, M2, M3, M4, M5, M6 모든 월**에 같은 `user_id`가 다시 `payment_complete`를 발생시킨 비율을 매달 측정
- **한 달 단위로 보는 이유**: 3개 점(M1/M3/M6)만 보면 "M1 → M3 사이 어디서 꺾였는지"를 모릅니다. 한 달 단위로 봐야 **이탈 곡선의 모양**(가파른 초기 이탈인지 / 점진적 감소인지 / 특정 시점 절벽인지)이 보이고, 그 모양이 처방을 결정합니다.
- 왜 중요한가: 토리치는 본질적으로 **"매월 1회 의식적으로 사용"**하면 충분한 앱입니다. 일별(D1/D7/D30) 재방문률은 "매일 들어와야 좋은 앱"의 지표라 토리치엔 의미가 약합니다. **"이번 달의 약속을 지켰는가"**가 진짜 의미 있는 리텐션입니다.
- 목표(가설치): M1 50% → M6 15% 사이를 **부드럽게 감쇠하는 곡선**. 특정 월에 절벽(예: M2가 갑자기 25%로 급락)이 보이면 그 시점의 알림 실패/UI 마찰/이메일 도달 이슈를 의심.

> **단기 반응 검증으로만 D14~D15 사용**: 월 납입 알림이 최초로 발송되는 D14~D15 구간의 일별 재방문은 "알림이 즉시 반응을 만들었나"를 보는 **단기 검증** 용도로만 가치가 있습니다. 알림의 진짜 가치는 그 달(또는 다음 달)의 `payment_complete` 발생 여부로 검증해야 합니다.

### KPI 4: 월별 납입 완료율 (참여 깊이)
**"이번 달 납입 예정이었던 활성 투자 건들 중 실제로 완료 체크가 된 비율은?"**

- 측정 방법: 그 달의 `payment_complete` 수 ÷ 그 달에 납입 예정이었던 활성 투자 건 수
- 왜 중요한가: 등록은 많은데 완료가 적다면 "체크하기 귀찮은 앱"이라는 신호입니다. 알림이 안 가는지, UI가 어려운지 추적해야 합니다.
- 목표(가설치): 70% 이상

### KPI 5: 알림 허용률 → 완료 전환율 (알림 가치 검증)
**"앱을 설치한 사람 중 푸시 알림을 허용한 비율은? 그리고 푸시로 들어온 세션이 실제 납입 완료까지 이어진 비율은?"**

두 단계로 측정합니다.

1. **허용률**: `notification_permission_prompt` → `notification_permission_granted` 전환율
2. **완료 전환율**: 푸시 탭 진입(`notification_open`, source=`push`) → 24시간 내 같은 user_id의 `payment_complete` 발생 비율

- 왜 중요한가: 알림은 토리치의 핵심 리텐션 도구입니다. 허용률만으로는 부족하고, **"알림이 실제 행동(완료)을 만드는가"**가 진짜 검증 포인트입니다. 완료 전환율이 낮으면 알림 문구/타이밍/딥링크 도착 화면을 개선해야 한다는 신호입니다.

---

## 5. 측정할 이벤트 목록

### 5.1 자동으로 수집되는 이벤트 (코드 작업 없이 GA 켜기만 해도 됨)

GA4를 활성화하는 것만으로 아래 이벤트들은 자동으로 쌓입니다.

| 이벤트 이름 | 언제 발생하나 |
| --- | --- |
| `first_visit` | 해당 기기에서 처음 앱을 열었을 때 |
| `session_start` | 새 세션(방문)이 시작될 때 |
| `page_view` | 화면(페이지)이 바뀔 때마다 |
| `user_engagement` | 화면을 10초 이상 보고 있을 때 |

### 5.2 직접 코드를 심어야 하는 이벤트 (커스텀 이벤트)

아래 이벤트들은 사용자가 특정 행동을 했을 때 코드를 통해 직접 전송합니다. 모든 이벤트에는 `platform` (web/ios/android) 파라미터가 `app/lib/analytics.ts` 래퍼에 의해 자동으로 함께 전송됩니다.

> **코드 위치 표기**: 아래 표의 "코드 위치"는 활성화 시점에 이벤트가 들어가야 할 권장 지점입니다. 토리치는 훅 분리 리팩터링이 진행되어 다수가 hook 파일에 있고, 일부는 아직 구현되지 않은 신규 이벤트입니다(특히 납입군).

**납입(payment) 관련 — 가장 중요!**

토리치 가치의 핵심은 "등록"이 아니라 "매월 납입 체크"입니다. 이 이벤트군이 KPI 2~4의 근거 데이터입니다.

| 이벤트 이름 | 언제 보내나 | 코드 위치 (예정) | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| **`payment_complete`** | **단일 납입을 완료 체크했을 때** | 납입 토글 핸들러 (예: `usePaymentHistory` 또는 상세 화면 핸들러) | `month_offset`: 이번 달 기준 상대 월 (0=당월, -1=지난달 등 소급), `is_retroactive`: 소급 여부 |
| `payment_uncheck` | 완료 체크를 취소했을 때 | 동일 | `month_offset` |
| `payment_complete_bulk` | 소급 일괄 완료 버튼으로 여러 달을 한 번에 완료했을 때 | 소급 일괄 완료 모달 | `count_bucket`: 완료한 건수 구간 (`1_3` / `4_6` / `7_12` / `>=13`) |

> **왜 필요한가?** "등록 후 한 번도 체크 안 한 유령 유저"와 "매달 꾸준히 체크하는 유저"를 구별할 수 있는 유일한 지표군입니다. KPI 2(첫 납입 완료율), KPI 3(월간 리텐션), KPI 4(월별 완료율)이 모두 이 이벤트에 의존합니다.

> **PII 주의**: 절대 금액 자체는 보내지 않습니다. 이벤트 자체가 "그 달의 약속을 지켰다"는 신호로 충분합니다.

**온보딩 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `onboarding_view` | 온보딩 화면을 볼 때마다 | `app/components/Onboarding/OnboardingView.tsx` | `step`: 현재 단계 번호 (1부터) |
| `onboarding_complete` | 온보딩을 끝까지 완료했을 때 | 동일 | — |

> **왜 필요한가?** 온보딩 중 어느 단계에서 이탈이 많은지 알 수 있습니다.

> **step→화면 매핑** (`app/constants/onboarding.ts` 기준 — 단계 변경 시 함께 갱신 필요):
>
> | step | 제목 | 화면 의미 |
> | --- | --- | --- |
> | 1 | 적립식 투자, 토리치로 가볍게 시작 | 홈 대시보드 소개 (앱 첫 진입 인상) |
> | 2 | 이번 달 넣을 날, 한 번에 확인 | 캘린더·납입 일정 소개 |
> | 3 | 작은 돈도 꾸준히, 흔들리지 않게 | 통계·예상 자산 소개 / "시작하기" 버튼 → `/login` |
>
> 마지막 step 3에서 "시작하기" 버튼을 누르면 `onboarding_complete`가 송신되고 `/login`으로 이동합니다. 즉 step 1~2에서 이탈하면 활성화 퍼널 Step 2(`onboarding_complete`)에서 떨어집니다.

**인증 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `login_click` | 로그인 버튼을 눌렀을 때 | `app/hooks/auth/useLoginAuth.ts` | `method`: "google" 또는 "apple" |
| `login_success` | 로그인이 완료됐을 때 | google: `app/components/AuthDeepLinkHandler.tsx` / apple: `app/hooks/auth/useLoginAuth.ts` | `method` |
| `login_failure` | 로그인이 실패했을 때 (취소/네트워크/거부 등) | 로그인 훅 catch 분기 (신규 추가) | `method`, `reason`: "cancelled" / "network" / "denied" / "unknown" |
| `logout_click` | 로그아웃 버튼을 눌렀을 때 | `app/hooks/auth/useSettingsAuth.ts` | — |

> **왜 필요한가?** 로그인 실패율을 보려면 `login_failure`가 반드시 있어야 합니다. `login_click` 대비 `login_success` 비율만으로는 "버튼 누르고 그냥 안 한 유저"와 "실패한 유저"가 구분되지 않습니다.

**투자 관련 (참여 진입)**

> 핵심 KPI는 납입 완료군입니다. 이 그룹은 "납입을 시작할 수 있는 상태로 들어왔는가"를 보는 선행 지표입니다.

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `investment_add_click` | 투자 추가 버튼을 눌렀을 때 | `app/components/Dashboard.tsx`, `app/components/DashboardSections/EmptyState.tsx` | `entry_point`: "dashboard" / "empty_state" / "calendar" |
| `investment_create_success` | 투자 등록을 완료했을 때 | `app/hooks/investment/add/useAddInvestmentSubmit.ts` | `amount_bucket`, `cycle_type`: "monthly"(매월 같은 날) 또는 "custom"(여러 날 직접 지정), `has_rate`: 수익률 설정 여부 |
| `investment_edit_success` | 투자 정보를 수정했을 때 | `InvestmentDetailView.tsx` 관련 핸들러 (구현 예정) | `amount_bucket`: 변경 후 금액 구간 |
| `investment_delete` | 투자를 삭제했을 때 | `app/components/Common/DeleteConfirmModal.tsx` | — |

> **`cycle_type` 값**: 현재 토리치는 매월 같은 날 납입(`monthly`) 또는 여러 날 직접 지정(`custom`) 두 가지만 지원합니다. 주/일 단위는 미지원이므로 GA에 보내지 않습니다. `custom`은 분석 시 "비정형 납입 패턴" 그룹으로 묶어 봅니다.

**목적(Goal) 관련 (보조 신호)**

> 핵심 KPI는 납입 완료군이고, 목적(Goal) 이벤트군은 **보조 신호**입니다. KPI 5개에는 안 끼웁니다. 목적은 "결혼·내 집 마련 같은 큰 자금 모으기" 기능으로, 사용자가 만든 목적이 **죽은 목적**(만들고 한 번도 투자랑 안 묶임)이 되는지, 어떤 프리셋이 인기인지 등 부가 인사이트용입니다.

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `goal_add_click` | 대시보드에서 "목적 만들기"·"+" 버튼을 눌렀을 때 | `app/components/DashboardSections/GoalSection.tsx` (inline `onCreate`) | `entry_point`: "dashboard_empty"(목적이 0개일 때 빈 상태 CTA) / "dashboard_carousel"(이미 1개 이상 있고 추가 누름) |
| `goal_create_success` | 목적 생성이 완료됐을 때 | `app/goal/new/page.tsx` `handleSubmit` | `target_amount_bucket` (목표 금액 구간), `has_deadline`: 마감일 설정 여부, `has_external_amount`: 이미 모은 돈 입력 여부, `preset_used`: "결혼 자금"/"주택 자금"/"여행"/"차"/"이사" 또는 `"custom"`(직접 입력) |
| `goal_record_linked` | 상세 페이지에서 기존 투자를 목적에 묶었을 때 | `app/goal/[id]/page.tsx` `handleLink` | `monthly_amount_bucket`: 묶은 투자의 월 납입 금액 구간 |
| `goal_completed` | 진행률 100%를 처음 도달했을 때 (자동 감지) | `app/goal/[id]/page.tsx` 자동 완료 useEffect | `target_amount_bucket`, `days_to_complete`: 생성→완료 일수, `linked_record_count`: 연결된 투자 건수 |
| `goal_delete` | 목적을 삭제했을 때 | `app/goal/[id]/page.tsx` `handleArchive` + `app/components/DashboardSections/GoalSection.tsx` `handleDelete` | `entry_point`: "detail_menu"(상세 더보기) / "swipe"(카드 스와이프) |

> **이 데이터로 답할 수 있는 질문 (3가지)**
>
> 1. **목적 기능을 만든 사람은 진짜 쓰는가?** — `goal_create_success` 발생자 중 **30일 내 `goal_record_linked` 발생 비율**. 30% 미만이면 "만들고 방치"가 다수라는 신호 → 폼에서 투자 연결 단계 강제하거나 가이드 강화 검토.
> 2. **어떤 프리셋이 인기인가?** — `goal_create_success.preset_used` 값별 분포. 한쪽에 90%+ 쏠리면 나머지는 숨기고 단순화 고려. 골고루 분산되면 그대로 유지.
> 3. **사람들이 어떤 규모/기간의 목적을 세우는가?** — `goal_create_success.target_amount_bucket` 분포 + `goal_completed.days_to_complete` 평균. "30대 중반의 1억짜리 결혼자금이 평균 14개월에 달성"같은 페르소나성 인사이트가 나옴.

> **PII 주의**: 목적의 이름(`goal.name`), id, 메모, 실제 금액은 절대 GA로 보내지 않습니다. 모두 `amountBucket()`을 통한 구간 변환 또는 boolean으로만.

> **명시적으로 부착하지 않은 이벤트**: `goal_preset_selected`(프리셋 클릭마다 노이즈 큼 — 결과는 `preset_used`에서 보면 충분), `goal_record_unlinked`(풀기는 토글 실수 노이즈), `goal_amount_adjusted`(폼 내부 디테일), `goal_detail_viewed`(자동 `page_view`로 충분), `goal_edit_*`(수정은 빈도 낮고 검증할 가설 없음).

**캘린더 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `calendar_date_select` | 캘린더에서 날짜를 선택할 때 | `app/hooks/calendar/useCalendar.ts` | — |

**통계 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `stats_view` | 통계 화면에 진입할 때 | `app/stats/page.tsx` | `filter`: 현재 필터값 (예: `ALL`/`YEAR`/`MONTH`) |
| `stats_filter_change` | 통계 필터를 바꿀 때 | `app/hooks/stats/usePeriodFilter.ts` | `from`: 이전 필터, `to`: 변경된 필터 |

> **이 데이터로 내릴 수 있는 결정 (3가지)**
>
> 1. **통계 화면 유지/축소 결정**: 활성 유저 중 월 1회 이상 `stats_view`를 발생시키는 비율을 측정. **10% 미만이면 통계 화면은 사실상 죽은 기능 → 진입점을 단순화하거나 후순위로 밀고 다른 기능에 리소스 투입.**
> 2. **필터 UI 단순화**: ALL/YEAR/MONTH 사용 분포가 한쪽으로 쏠리면(예: 80%+ 한 필터만 사용) **나머지 필터를 숨기거나 디폴트만 남겨도 손실이 거의 없음** → UI 단순화 결정 근거.
> 3. **습관 강화 가설 검증 (v2)**: stats를 자주 보는 유저(`stats_view` 월 3회 이상) vs 안 보는 유저의 **M3 리텐션을 비교**. 차이가 유의미하게 크면 통계 화면이 "습관 강화 도구" 역할을 한다는 증거 → 통계 기능을 더 발전시키는 게 정당화됨. 차이가 없으면 단순 호기심 도구일 뿐.
>
> **솔직한 한계**: 1번을 빼면 초기 유저 수에선 코호트가 너무 작아 의미 있는 결론이 잘 안 나옵니다. **PR 5에 둔 이유**가 이것 — 핵심 KPI(2~5)가 자리 잡기 전엔 이 이벤트의 가치는 낮습니다. 켜두기만 하고 분석은 나중에 하는 게 맞습니다.

**알림 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `notification_sent` | 푸시 알림이 실제로 발송됐을 때 | Edge Function (`supabase/functions/send-push`) — 클라이언트 SDK 대신 GA4 Measurement Protocol로 서버사이드 송신 | `notification_type`: "monthly_reminder" / "retroactive" 등 |
| `notification_permission_prompt` | 알림 허용 요청 팝업이 떴을 때 | `providers/NotificationProvider.tsx` | — |
| `notification_permission_granted` | 사용자가 알림을 허용했을 때 | 동일 | — |
| `notification_permission_denied` | 사용자가 알림을 거부했을 때 | 동일 | — |
| `notification_open` | 알림 탭에 진입했을 때 | `app/notifications/page.tsx` | `source`: "push"(푸시 알림 탭) / "in_app"(앱 내 진입) |

> **왜 발송 측 이벤트가 필요한가?** "발송 → 탭 → 완료"의 완결 funnel을 보려면 발송 시점도 GA에 있어야 합니다. 클라이언트 SDK는 푸시 도착 시점에 앱이 백그라운드/종료 상태이므로 `track()`을 호출할 수 없어, **Edge Function에서 GA4 Measurement Protocol로 서버 사이드 이벤트를 직접 송신해야 합니다.** 이게 빠지면 KPI 5(알림 가치 검증)는 절반만 계산됩니다.

**설정 / 기타**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `theme_toggle` | 다크/라이트 모드를 바꿀 때 | `app/components/ThemeSections/ThemeProvider.tsx` | `mode`: "light"/"dark"/"system" |
| `app_error` | 앱 에러 화면이 표시될 때 | `app/error.tsx` | `message`: 에러 분류 ("network"/"server"/"unknown"), `digest`: Next.js 에러 다이제스트 |

### 5.3 금액 구간(amount_bucket) 기준

실제 금액 대신 아래 구간으로 변환해서 전송합니다. (실제 금액 전송은 개인정보 위반 위험)

| 실제 금액 | 전송하는 값 |
| --- | --- |
| 10만 원 미만 | `"<100k"` |
| 10만 ~ 30만 원 | `"100k_300k"` |
| 30만 ~ 50만 원 | `"300k_500k"` |
| 50만 ~ 100만 원 | `"500k_1m"` |
| 100만 ~ 300만 원 | `"1m_3m"` |
| 300만 ~ 1000만 원 | `"3m_10m"` |
| 1000만 원 이상 | `">=10m"` |

> **왜 30만 원에서 한 번 더 쪼개나?** 정기 적립자는 30~50만 원 구간에 몰릴 가능성이 큽니다. 10~50만 원을 한 버킷으로 두면 토리치 주 사용자층의 분포가 평탄화되어 인사이트를 놓칩니다.

**이 데이터로 얻는 인사이트:**

- **유저층 파악**: 전체 등록의 70%가 `100k_500k`(10~50만 원)에 몰려있다면, 앱의 주 타겟이 소액 정기 투자자임을 확인할 수 있습니다. 반대로 고액 구간이 많다면 진지한 투자자 중심 서비스로 방향을 잡을 수 있습니다.
- **기능 우선순위 결정**: 고액 구간(`1m_3m` 이상) 유저가 예상보다 많다면 수익률 상세 분석 같은 고급 기능을 먼저 만드는 게 낫다는 판단을 내릴 수 있습니다.
- **교차 분석**: `amount_bucket`과 `has_rate`(수익률 설정 여부)를 함께 보면 "고액 투자자일수록 수익률을 더 많이 설정하는가?"를 확인할 수 있고, 수익률 기능의 강화 여부를 결정하는 근거가 됩니다.

---

## 6. 퍼널 — "어디서 이탈하는지" 보는 법

퍼널(Funnel)은 사용자가 특정 경로를 따라 얼마나 진행하는지 단계별로 보여주는 보고서입니다.
예를 들어 100명이 앱을 설치했는데 10명만 투자를 등록했다면, 퍼널이 어디서 새는지 보여줍니다.

GA4 왼쪽 메뉴 **탐색(Explore) > 빈 양식(Blank) > 퍼널 탐색** 에서 직접 만들 수 있습니다.

### 퍼널 1: 신규 유저 활성화 퍼널 (가장 중요)

사용자가 앱을 처음 발견해서 **첫 납입 완료(=실제 가치 체험)까지** 도달하는 여정입니다.

```
Step 1: first_visit                  ← 앱을 처음 열었다
    ↓
Step 2: onboarding_complete          ← 온보딩을 끝냈다
    ↓
Step 3: login_success                ← 로그인까지 했다
    ↓
Step 4: investment_create_success    ← 첫 투자를 등록했다 (선행 조건)
    ↓
Step 5: payment_complete (1st)       ← 첫 달 납입을 직접 체크했다 ✅ Aha 모먼트
```

Step 5는 "등록"이 아니라 "완료 체크"입니다. 토리치 유저는 이 시점에서야 제품 가치를 체험합니다.

**목표**: Step 1 → Step 5 전환율 **30% 이상** (가입 후 30일 코호트 기준)

### 퍼널 2: 월간 행동 리텐션 (KPI 3과 동일)

토리치는 매일 들어오는 앱이 아니라 **매월 한 번 약속을 지키는 앱**이므로, 일별 재방문(D1/D7/D30)이 아니라 **"이번 달에 또 `payment_complete`를 했는가"** 를 봅니다.

- 코호트 정의: 첫 `payment_complete`가 발생한 월(M0)을 기준으로 같은 `user_id` 유저를 묶음
- 측정 포인트: **M1, M2, M3, M4, M5, M6 — 한 달 단위 전체** (이탈 곡선 모양을 봐야 절벽 시점이 드러남)
- GA4에서 "코호트 탐색" 보고서를 사용하되, 이벤트 기반 리턴 측정으로 설정 (단순 page_view가 아님)

> **D14~D15 일별 리텐션은 보조 검증으로만**: 월 알림 첫 발송 직후 일별 재방문률은 "알림이 즉시 클릭/방문을 만들었는가"의 단기 신호로만 사용합니다. **알림이 진짜 효과적이었는지는 같은 달 또는 다음 달의 `payment_complete` 발생 여부**(= KPI 3, 퍼널 3)로만 판정합니다.

### 퍼널 3: 알림 가치 검증 퍼널 (발송 → 탭 → 완료)

KPI 5의 핵심 funnel입니다. 발송과 완료를 모두 GA에 잡아야 알림이 진짜 가치를 만드는지 측정할 수 있습니다.

```
Step A — 허용 단계
  notification_permission_prompt → notification_permission_granted

Step B — 발송→탭→완료 단계 (활성화 시 가장 중요)
  notification_sent (Edge Function 측 송신)
    ↓
  notification_open (source=push)         ← 푸시를 실제로 탭했다
    ↓
  payment_complete (24h 내, 같은 user_id) ← 그 결과로 약속을 지켰다 ✅
```

- Step A 허용률이 낮으면 → 알림 요청 문구/타이밍 개선
- Step B 중간 이탈(`notification_sent` → `notification_open`이 낮음) → 알림 카피/시간대 개선
- Step B 끝 이탈(`notification_open` → `payment_complete`이 낮음) → 딥링크 도착 화면/완료 UI 마찰 점검

> **`notification_sent`가 빠지면 이 퍼널은 무력화됩니다.** 클라이언트는 푸시 도착 시점에 백그라운드라 `track()`을 부를 수 없으니, **Edge Function `supabase/functions/send-push`에서 GA4 Measurement Protocol로 서버사이드 이벤트를 송신**해야 합니다.

---

## 7. 실제 코드 구현 방법

### 7.1 Step 1: 환경변수 설정 (Dev/Prod 분리)

토리치는 두 개의 GA 속성을 쓰므로 환경별로 다른 ID가 들어갑니다.

**로컬 개발 — `.env.local`** (gitignore됨, 직접 만들기):
```bash
NEXT_PUBLIC_GA_ID=G-C8E4VZ883Y   # Torich Dev
```

**iOS 앱 빌드 — `.env.production`** (`.gitignore`되어 있어 로컬/빌드 머신에만 존재):
```bash
NEXT_PUBLIC_GA_ID=G-SC1LBTD65X   # Torich Prod
```
> `npm run build:app`은 이 파일을 읽어 정적 빌드를 만듭니다. **이 파일은 git에 커밋되지 않으므로** 빌드를 수행하는 머신에 본인이 직접 작성해야 하며, 앱스토어 출시 빌드 직전엔 반드시 prod ID로 되어 있는지 확인합니다.

**Vercel 대시보드** (Project Settings → Environment Variables):
| 환경 | 값 |
| --- | --- |
| Production | `G-SC1LBTD65X` |
| Preview | `G-C8E4VZ883Y` |
| Development | (없거나 dev) |

대시보드 값이 `.env.production`보다 우선하므로, Vercel에 명시 등록만 해두면 안전합니다.

### 7.2 Step 2: `app/layout.tsx` 주석 해제

현재 주석으로 꺼져 있는 GA 컴포넌트를 아래와 같이 수정합니다.

**변경 전:**
```tsx
import type { Metadata, Viewport } from "next";
// import { GoogleAnalytics } from "@next/third-parties/google";

...

{/* <GoogleAnalytics gaId="G-C8E4VZ883Y" /> */}
```

**변경 후:**
```tsx
import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";

...

{process.env.NEXT_PUBLIC_GA_ID && (
  <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
)}
```

이것만 해도 `page_view`, `session_start`, `first_visit` 같은 기본 이벤트는 바로 쌓이기 시작합니다.

### 7.3 Step 3: 공통 애널리틱스 유틸 파일 만들기

`app/lib/analytics.ts` 파일을 새로 만듭니다.
이 파일 하나만 있으면 어느 컴포넌트에서든 `track("이벤트명", { 파라미터 })` 한 줄로 이벤트를 보낼 수 있습니다.

```ts
// app/lib/analytics.ts

import { sendGAEvent } from "@next/third-parties/google";
import { Capacitor } from "@capacitor/core";

type Platform = "web" | "ios" | "android";

// 현재 플랫폼을 자동으로 감지합니다 (웹 / iOS / Android)
const getPlatform = (): Platform => {
  if (typeof window === "undefined") return "web";
  const p = Capacitor.getPlatform?.();
  return p === "ios" || p === "android" ? p : "web";
};

/**
 * GA4 이벤트를 전송하는 공통 함수입니다.
 * 모든 이벤트에 platform 파라미터가 자동으로 붙습니다.
 *
 * 사용 예시:
 *   track("investment_create_success", { amount_bucket: "100k_500k" });
 */
export const track = (
  event: string,
  params: Record<string, string | number | boolean> = {},
) => {
  try {
    sendGAEvent("event", event, { platform: getPlatform(), ...params });
  } catch {
    // 애널리틱스 오류가 앱 동작을 방해해서는 안 됩니다. 조용히 실패합니다.
  }
};

/**
 * 실제 금액(원)을 GA에 안전하게 보낼 수 있는 구간 문자열로 변환합니다.
 * 개인정보(실제 금액)가 GA에 직접 전송되는 것을 방지합니다.
 *
 * 사용 예시:
 *   amountBucket(350000) // → "100k_500k"
 */
export const amountBucket = (won: number): string => {
  if (won < 100_000) return "<100k";
  if (won < 300_000) return "100k_300k";
  if (won < 500_000) return "300k_500k";
  if (won < 1_000_000) return "500k_1m";
  if (won < 3_000_000) return "1m_3m";
  if (won < 10_000_000) return "3m_10m";
  return ">=10m";
};
```

### 7.4 Step 4: 이벤트 실제 사용 예시

**투자 등록 성공 시 (가장 중요한 이벤트)**

```ts
// app/add/page.tsx 또는 관련 훅 내부
import { track, amountBucket } from "@/lib/analytics";

// 투자 등록 API 호출이 성공한 직후
track("investment_create_success", {
  amount_bucket: amountBucket(amount),    // 금액 구간 (실제 금액 X)
  cycle_type: cycle,                       // "monthly", "weekly", "daily"
  has_rate: rate > 0,                      // 수익률을 입력했는지 여부
});
```

**로그인 버튼 클릭 시**

```ts
// app/login/page.tsx 내 버튼 onClick
import { track } from "@/lib/analytics";

track("login_click", { method: "google" });
```

**알림 허용 결과**

```ts
// providers/NotificationProvider.tsx
import { track } from "@/lib/analytics";

// 알림 요청 팝업을 띄우기 직전
track("notification_permission_prompt");

// 사용자가 허용을 선택했을 때
track("notification_permission_granted");

// 사용자가 거부를 선택했을 때
track("notification_permission_denied");
```

---

## 8. Capacitor 앱(iOS/Android) 주의사항

토리치는 Next.js 웹앱을 Capacitor를 통해 iOS/Android 앱으로 배포하고 있습니다.
이 구조에서 GA4를 사용할 때 알아야 할 것들이 있습니다.

### 문제 1: 앱에서의 Origin이 이상하게 찍힌다

웹 브라우저에서는 `https://torich.vercel.app` 처럼 정상적인 URL이 GA에 찍힙니다.
Capacitor 앱에서는 내부적으로 `capacitor://localhost` 라는 가상 주소를 사용합니다.
GA는 히트(이벤트)를 받긴 받지만, 호스트명이 `localhost`로 찍혀서 웹과 앱 트래픽이 섞여 보입니다.

**해결책**: 모든 이벤트에 `platform` 파라미터를 붙이고 (7.3의 래퍼가 자동으로 처리),
GA4 보고서에서 `platform` 파라미터로 필터링해서 구분해서 봅니다.

### 문제 2: iOS에서 세션이 짧게 끊길 수 있다

iOS에서는 Safari의 ITP(Intelligent Tracking Prevention) 정책으로 인해 쿠키 기반 세션이 예상보다 짧게 끊길 수 있습니다. 이 때문에 재방문 유저가 신규 유저로 잘못 카운트될 수 있고, 그러면 KPI 1(신규 유저 수)부터 KPI 3(월간 리텐션)까지 모두 부정확해집니다.

**해결책: GA `user_id` 설정은 활성화 시점의 필수 작업입니다 (선택 아님).**

- 로그인 직후 Supabase `user.id`를 **SHA-256 해시**한 값을 GA에 `user_id`로 설정합니다 (`gtag('config', GA_ID, { user_id: hashedUserId })` 또는 동등한 호출).
- user_id는 세션과 무관하게 동일 유저로 식별되므로 ITP/Capacitor 환경의 세션 끊김 문제를 우회합니다.
- **반드시 해시된 UUID만 사용합니다.** Supabase user.id 원본/이메일/이름 등 PII는 절대 보내지 않습니다.
- 비로그인 유저에게는 user_id가 없어 일반 클라이언트 ID로만 추적됩니다(부정확). 토리치는 로그인 게이트 앱이라 큰 문제는 아니지만, 활성화 퍼널 중 `login_success` 이전 단계는 클라이언트 ID 기반임을 인지하고 분석해야 합니다.

### 장기 방향: Firebase Analytics 병행 고려

현재 프로젝트에 `firebase` 패키지가 이미 설치되어 있습니다.
초기 1~2개월은 GA4 단일로 충분하지만, 이후 앱 리텐션을 더 정확하게 보려면
Firebase Analytics를 네이티브에서 직접 연결하는 것이 더 정확합니다.
(Firebase Analytics ↔ GA4는 연동 가능)

---

## 9. 개인정보 관련 체크

GA4를 쓴다는 사실을 사용자에게 알려야 합니다.

**해야 할 것:**
1. `app/settings/privacy/page.tsx` (개인정보 처리방침 화면)에 아래 내용 추가
   - "서비스 개선을 위해 Google Analytics 4를 사용합니다."
   - "수집되는 정보: 앱 사용 행동(화면 전환, 기능 사용 빈도 등)"
   - "개인 식별 정보(이름, 이메일, 금액 등)는 수집하지 않습니다."

2. 앱스토어 심사 시 **App Privacy → Data Used to Track You** 섹션에서
   `Usage Data`를 "Not Linked to Identity"로 체크합니다.

**GA4 기본 제공 보호:**
- IP 주소 익명화: GA4에서 기본 적용됩니다. (별도 설정 불필요)
- 데이터 보관 기간: GA4 기본 14개월 (필요 시 조정 가능)

---

## 10. GA4 대시보드 초기 세팅

GA4 콘솔(analytics.google.com)에서 아래 3가지만 설정하면 됩니다.
처음 데이터가 쌓이기 시작한 날로부터 24~48시간 후에 보고서가 보이기 시작합니다.

### Step 1: `investment_create_success`를 전환으로 마킹

1. GA4 콘솔 → **구성(Configure) → 이벤트(Events)**
2. `investment_create_success` 옆 "전환으로 표시" 토글을 켭니다.
3. 이제 홈 화면에서 오늘의 전환 수(= 투자 등록 수)를 바로 볼 수 있습니다.

### Step 2: 활성화 퍼널 만들기

1. GA4 콘솔 → **탐색(Explore) → 새 탐색 만들기 → 빈 양식**
2. 기법(Technique)을 "퍼널 탐색"으로 변경
3. 6번에서 정의한 Step 1~5 이벤트를 순서대로 추가
4. 일/주 단위 추이를 볼 수 있게 설정

### Step 3: platform 세그먼트 비교 보고서

1. GA4 콘솔 → **탐색(Explore) → 새 탐색 만들기**
2. 지금은 세그먼트를 2개 만듭니다: `platform=web`, `platform=ios`
   - Android 출시 후 `platform=android` 세그먼트를 추가합니다.
3. 신규 유저 / 세션 수 / 전환 수를 세그먼트별로 비교

---

## 11. 구현 체크리스트 — 활성화 후 현황

> **상태 표기**: ✅ 완료 / ⏳ 시간이 필요한 후속 작업 / ❌ 미실행

**기본 인프라** — 모두 완료 (2026-05-08)
- [x] ✅ `app/lib/analytics.ts` 공통 래퍼 (`track`, `setUserId`, `amountBucket`, `daysBetween`, `countBucket`, `monthOffset`, `classifyAuthFailure`)
- [x] ✅ `app/layout.tsx` 환경변수 기반 GA 마운트
- [x] ✅ Vercel Production/Preview 환경변수 주입 + Redeploy
- [x] ✅ `.env.local` (Dev) / `.env.production` (Prod) GA ID 분리 주입
- [x] ✅ `app/hooks/auth/useAuth.ts`에서 로그인 시 `setUserId` 호출 (SHA-256 해시)
- [x] ✅ Network 탭 `collect?v=2&tid=G-SC1LBTD65X` 200/204 1차 검증 완료

**이벤트 연결 — PR별 부착 상태**
- [x] ✅ **PR 1 — 납입 핵심**: `payment_complete`, `payment_uncheck`, `payment_complete_bulk` (`app/hooks/payment/usePaymentHistory.ts`)
- [x] ✅ **PR 2 — 알림**: `notification_permission_prompt/granted/denied`, `notification_open`(클라이언트) + `notification_sent`(`supabase/functions/send-push` Measurement Protocol)
- [x] ✅ PR 3 — 투자: `investment_add_click`, `investment_create_success`, `investment_delete`
- [x] ✅ PR 4 — 인증: `login_click`, `login_success`, `login_failure`, `logout_click`
- [x] ✅ PR 5 — 나머지: `onboarding_view/complete`, `calendar_date_select`, `stats_view`, `stats_filter_change`, `theme_toggle`, `app_error`
- [x] ✅ **PR 6 — 목적(Goal)**: `goal_add_click`, `goal_create_success`, `goal_record_linked`, `goal_completed`, `goal_delete` (보조 신호)

**GA4 콘솔 설정 (활성화 후)**
- [ ] ⏳ **`payment_complete`를 전환(Conversion)으로 표시** — 활성화 후 24h 지나야 이벤트 목록에 노출됨. 콘솔 작업 가이드: [`docs/ga4-console-guide.md`](./ga4-console-guide.md) §4
- [ ] ⏳ 활성화 퍼널(§6 퍼널 1) 탐색 보고서 생성 — 가이드: console-guide.md §5 보고서 ①
- [ ] ⏳ 월간 행동 리텐션(§6 퍼널 2) 코호트 보고서 생성 — 가이드: console-guide.md §5 보고서 ②
- [ ] ⏳ 알림 가치 퍼널(§6 퍼널 3) 보고서 생성 — 가이드: console-guide.md §5 보고서 ③
- [ ] ⏳ 데이터 보관 기간 26개월로 변경 — 가이드: console-guide.md §4 B
- [ ] (선택) goal 보조 분석: `goal_create_success.preset_used` 분포 + 30일 내 `goal_record_linked` 전환율 — 가이드: console-guide.md §5 후반부

**개인정보**
- [x] ✅ 개인정보 처리방침에 GA 고지 (`lib/legal/privacy-policy.ko.ts` 제1조·제5조)
- [ ] ⏳ 앱스토어 심사 시 App Privacy → Usage Data 체크 (다음 iOS 출시 빌드 시점)

**iOS 출시 빌드 — 다음 빌드 시점에 확인**
- [ ] ⏳ `.env.production`이 Prod ID(`G-SC1LBTD65X`)로 박혀 있는지 빌드 직전 재확인
- [ ] ⏳ `capacitor.config.ts`의 `server.url`이 주석 처리된 상태로 빌드되는지 확인
- [ ] ⏳ Apple 심사 통과 + 사용자 업데이트 후부터 iOS GA 데이터 유입 시작

---

## 12. 다음 단계 (v2)

초기 1~2개월 데이터가 쌓이면 아래를 추가로 고려합니다.

**Firebase Analytics 네이티브 병행**
- 현재 `firebase` 패키지가 이미 설치되어 있어 추가 비용이 크지 않습니다.
- Firebase Analytics는 앱 환경에서 세션/리텐션을 더 정확하게 측정합니다.
- Firebase ↔ GA4 연동을 통해 웹/앱 데이터를 한 콘솔에서 볼 수 있습니다.

**유저 프로퍼티(User Properties) 추가**
- `investment_count_bucket`: 유저가 등록한 투자 건수 구간 (0건 / 1~3건 / 4건+)
- `primary_cycle`: 유저가 주로 쓰는 납입 주기 (월/주/일)
- 이를 통해 "투자 3건 이상 등록한 유저"와 "0건 유저"의 리텐션 차이를 비교할 수 있습니다.

**A/B 테스트 이벤트 설계**
- 기능 실험을 시작할 때는 `experiment_variant` 파라미터를 추가해서 어느 그룹에서 전환율이 높은지 측정합니다.
