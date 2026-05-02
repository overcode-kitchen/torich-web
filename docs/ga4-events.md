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

## 1. 현재 상태 — GA가 켜져 있나요?

**결론: 꺼져 있습니다.**

코드를 확인해보면, GA 라이브러리는 이미 설치되어 있고 측정 ID(`G-C8E4VZ883Y`)도 있지만
`app/layout.tsx` 59번째 줄에서 **주석 처리**되어 있습니다.

```tsx
{/* <GoogleAnalytics gaId="G-C8E4VZ883Y" /> */}
```

즉, 지금은 아무 데이터도 GA로 전송되지 않습니다.

| 항목 | 현재 상태 | 무엇을 해야 하나 |
| --- | --- | --- |
| GA 라이브러리(`@next/third-parties`) | ✅ 설치되어 있음 | 추가 설치 불필요 |
| GA 측정 ID | ✅ 코드에 있음 (`G-C8E4VZ883Y`) | 환경변수로 이전 권장 (급하지 않음) |
| GA 활성화 여부 | ✅ 활성화 완료 | `app/layout.tsx` 주석 해제 완료 |
| 버튼 클릭 등 커스텀 이벤트 | ❌ 하나도 없음 | 신규 작업 필요 |
| iOS 앱 환경 대응 | ⚠️ `platform` 파라미터 미적용 | `app/lib/analytics.ts` 래퍼 추가 필요 |
| Android 앱 | ➖ 아직 미배포 | 코드는 미리 심어두면 출시 시 자동 감지 |
| 개인정보 처리방침 GA 고지 | ❓ 미확인 | `settings/privacy` 페이지 확인 필요 |

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

### 규칙 4: 측정 ID는 코드에 직접 쓰지 않고 환경변수로 관리

지금 코드에는 `G-C8E4VZ883Y`가 직접 박혀 있습니다. 이게 왜 불편하냐면 나중에 GA 속성을 바꾸거나 테스트용/운영용을 분리할 때 코드 파일을 직접 수정하고 배포해야 하기 때문입니다.

환경변수란 "코드 밖에 값을 적어두고, 코드는 거기서 가져와라"고만 하는 방식입니다. `.env.local` 파일에 `NEXT_PUBLIC_GA_ID=G-C8E4VZ883Y`를 적어두면, 나중에 ID를 바꿔야 할 때 코드를 건드리지 않고 그 파일 값만 바꾸면 됩니다.

**지금 당장 급하지는 않습니다.** 커스텀 이벤트가 다 붙고 안정되면 그때 이전해도 됩니다.

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

모든 걸 다 볼 필요 없습니다. 지금 단계에서 아래 5가지만 매일 확인합니다.

### KPI 1: 신규 유저 수 (획득)
**"오늘 새로 들어온 사람이 몇 명인가?"**

- 측정 방법: GA4가 자동으로 수집하는 `first_visit` 이벤트 카운트
- 왜 중요한가: 마케팅/바이럴 효과를 확인하는 가장 기본 지표

### KPI 2: 첫 투자 등록률 (활성화, Aha 모먼트)
**"가입한 사람 중 7일 안에 투자를 1건이라도 등록한 비율이 얼마나 되는가?"**

- 측정 방법: `login_success` 대비 `investment_create_success` 비율 (7일 코호트)
- 왜 중요한가: 토리치의 Aha 모먼트는 "첫 투자를 등록하는 순간"입니다. 이 비율이 낮으면 앱이 너무 어렵거나, 온보딩이 잘 안 되고 있다는 신호입니다.
- **이 지표가 가장 중요합니다.** 30% 이상을 목표로 합니다.

### KPI 3: 재방문율 — 세분화 리텐션 (D1 ~ D30)
**"앱을 한 번 쓴 사람이 며칠 뒤에 다시 돌아오는가?"**

- 측정 방법: GA4 유지율 보고서 (Retention Report)에서 자동 확인 가능. 일 단위로 전부 볼 수 있습니다.
- 왜 중요한가: 서비스가 지속적으로 쓸 이유를 주는지 확인하는 지표입니다.

**확인할 리텐션 포인트:**

| 기준일 | 의미 | 토리치에서의 해석 |
| --- | --- | --- |
| D1 | 다음 날 재방문 | 앱이 첫날 인상에 남는가 |
| D3 | 3일 안에 다시 올 이유가 있는가 | 초기 탐색 행동 확인 |
| D5 | 첫 주 중반 | D3 대비 추가 이탈이 얼마나 되는가 |
| D7 | 일주일 후 재방문 | 주간 습관이 생겼는가 (목표: 20% 이상) |
| D10 | 10일차 | D7 이후 유지되는 유저 비율 |
| D14 | 2주 후 | **토리치 핵심 구간** — 월 납입 알림이 최초로 도착하는 시점 |
| D15 | 15일차 | D14 알림 효과가 실제 재방문으로 이어지는가 |
| D30 | 한 달 후 재방문 | 한 달 습관이 된 유저 비율 (목표: 8% 이상) |

> **토리치는 D14~D15 구간이 특히 중요합니다.** 월 납입 알림이 처음 발송되는 시점이기 때문입니다. 이 구간에서 리텐션이 올라가면 알림이 재방문을 만들어낸다는 직접적인 증거가 됩니다. 반대로 올라가지 않으면 알림 내용/시간대를 개선해야 한다는 신호입니다.

### KPI 4: 월별 투자 등록 수 (핵심 참여)
**"유저 1명이 한 달에 평균 몇 건의 투자를 등록하는가?"**

- 측정 방법: `investment_create_success` 이벤트 총 수 ÷ 활성 유저 수
- 왜 중요한가: 단순 방문이 아니라 실질적인 가치를 만들어내고 있는지 확인

### KPI 5: 알림 허용률 (알림 가치)
**"앱을 설치한 사람 중 푸시 알림을 허용한 비율이 얼마나 되는가?"**

- 측정 방법: `notification_permission_prompt` 대비 `notification_permission_granted` 비율
- 왜 중요한가: 알림이 토리치의 핵심 리텐션 도구입니다. 허용률이 낮으면 알림 요청 문구/타이밍을 개선해야 합니다.

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

아래 이벤트들은 사용자가 특정 행동을 했을 때 코드를 통해 직접 전송합니다.
모든 이벤트에는 `platform` (web/ios/android)이 자동으로 함께 전송됩니다.

**온보딩 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `onboarding_view` | 온보딩 화면을 볼 때마다 | `app/components/Onboarding/OnboardingView.tsx` | `step`: 현재 단계 번호 |
| `onboarding_complete` | 온보딩을 끝까지 완료했을 때 | 동일 | — |

> **왜 필요한가?** 온보딩 중 어느 단계에서 이탈이 많은지 알 수 있습니다.

**인증 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `login_click` | 로그인 버튼을 눌렀을 때 | `app/login/page.tsx` | `method`: "google" 또는 "apple" |
| `login_success` | 로그인이 완료됐을 때 | `app/components/AuthDeepLinkHandler.tsx` | `method`: "google" 또는 "apple" |
| `logout_click` | 로그아웃 버튼을 눌렀을 때 | `app/components/SettingsSections/AccountSection.tsx` | — |

> **왜 필요한가?** Google 로그인과 Apple 로그인 중 어느 쪽을 더 많이 쓰는지, 로그인 실패율이 얼마나 되는지 알 수 있습니다.

**투자 관련 — 가장 중요!**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `investment_add_click` | 투자 추가 버튼을 눌렀을 때 | `app/page.tsx` (대시보드 FAB) | `entry_point`: 어디서 버튼을 눌렀는지 ("dashboard"/"empty_state"/"calendar") |
| **`investment_create_success`** | **투자 등록을 완료했을 때** | **`app/add/page.tsx`** | `amount_bucket`: 금액 구간, `cycle_type`: 납입 주기(월/주/일), `has_rate`: 수익률 설정 여부 |
| `investment_edit_success` | 투자 정보를 수정했을 때 | `app/components/InvestmentDetailView.tsx` | `amount_bucket`: 변경 후 금액 구간 |
| `investment_delete` | 투자를 삭제했을 때 | `app/components/Common/DeleteConfirmModal.tsx` | — |

> **왜 필요한가?** `investment_create_success`는 토리치의 핵심 전환 지표입니다. GA4에서 이 이벤트를 "전환(Conversion)"으로 설정하면 매일 얼마나 많은 투자가 등록되는지 한눈에 볼 수 있습니다.

**캘린더 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `calendar_date_select` | 캘린더에서 날짜를 선택할 때 | `app/components/CalendarSections/SelectedDateSection.tsx` | — |

**통계 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `stats_view` | 통계 화면에 진입할 때 | `app/stats/page.tsx` | `filter`: 현재 필터값 (ALL/월/년) |
| `stats_filter_change` | 통계 필터를 바꿀 때 | `app/hooks/useInvestmentFilter.ts` 트리거 지점 | `from`: 이전 필터, `to`: 변경된 필터 |

> **왜 필요한가?** 통계 화면을 실제로 쓰는 사람이 얼마나 되는지, 어떤 필터를 주로 보는지 알 수 있습니다.

**알림 관련**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `notification_permission_prompt` | 알림 허용 요청 팝업이 떴을 때 | `providers/NotificationProvider.tsx` | — |
| `notification_permission_granted` | 사용자가 알림을 허용했을 때 | 동일 | — |
| `notification_permission_denied` | 사용자가 알림을 거부했을 때 | 동일 | — |
| `notification_open` | 알림 탭에 진입했을 때 | `app/notifications/page.tsx` | `source`: "push" (푸시 알림을 탭해서 진입) 또는 "in_app" (앱 내에서 직접 탭) |

> **왜 필요한가?** 알림 허용률이 낮으면 알림 요청 타이밍이나 문구를 개선해야 합니다. 알림 클릭률이 낮으면 알림 내용 자체가 관심을 끌지 못하는 것입니다.

**설정 / 기타**

| 이벤트 이름 | 언제 보내나 | 코드 위치 | 함께 보낼 추가 정보 |
| --- | --- | --- | --- |
| `theme_toggle` | 다크/라이트 모드를 바꿀 때 | `app/components/ThemeSections/ThemeProvider.tsx` | `mode`: "light"/"dark"/"system" |
| `app_error` | 앱 에러 화면이 표시될 때 | `app/error.tsx` | `message`: 에러 문구(고정값), `digest`: Next.js 에러 다이제스트 |

### 5.3 금액 구간(amount_bucket) 기준

실제 금액 대신 아래 구간으로 변환해서 전송합니다. (실제 금액 전송은 개인정보 위반 위험)

| 실제 금액 | 전송하는 값 |
| --- | --- |
| 10만 원 미만 | `"<100k"` |
| 10만 ~ 50만 원 | `"100k_500k"` |
| 50만 ~ 100만 원 | `"500k_1m"` |
| 100만 ~ 300만 원 | `"1m_3m"` |
| 300만 ~ 1000만 원 | `"3m_10m"` |
| 1000만 원 이상 | `">=10m"` |

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

사용자가 앱을 처음 발견해서 첫 투자를 등록하기까지의 여정입니다.

```
Step 1: first_visit           ← 앱을 처음 열었다
    ↓
Step 2: onboarding_complete   ← 온보딩을 끝냈다
    ↓
Step 3: login_success         ← 로그인까지 했다
    ↓
Step 4: investment_add_click  ← 투자 추가 버튼을 눌렀다
    ↓
Step 5: investment_create_success ← 실제로 투자를 등록했다 ✅
```

이 퍼널에서 각 단계의 전환율을 보면 **"Step 2에서 40%가 이탈했다"** 같은 인사이트를 얻을 수 있습니다.

**목표**: Step 1 → Step 5 전환율 **30% 이상** (가입 후 7일 코호트 기준)

### 퍼널 2: 리텐션 확인

투자를 등록한 유저(= 앱의 핵심 가치를 체험한 유저)가 D1, D3, D5, D7, D10, D14, D15, D30에 다시 돌아오는지 확인합니다.

- GA4 유지율 보고서에서 **"investment_create_success를 발생시킨 유저"** 세그먼트로 필터링
- 일반 유저 vs 투자 등록 유저의 재방문율을 비교하면 핵심 가치의 효과를 측정할 수 있습니다.
- **D14~D15 구간을 특히 주목합니다.** 월 납입 알림이 처음 발송되는 시점이므로, 이 구간에서 리텐션 곡선이 꺾이지 않고 유지된다면 알림이 효과를 내고 있다는 증거입니다.

### 퍼널 3: 알림 허용 퍼널

```
Step 1: notification_permission_prompt ← 알림 요청 팝업이 표시됨
    ↓
Step 2: notification_permission_granted ← 유저가 허용을 눌렀다
    ↓
Step 3: notification_open ← 나중에 알림을 실제로 탭해서 들어왔다
```

허용률(Step 1 → Step 2)이 낮으면 알림 요청 문구나 타이밍 개선이 필요합니다.

---

## 7. 실제 코드 구현 방법

### 7.1 Step 1: 환경변수 설정

`.env.local` 파일에 아래를 추가합니다. (없으면 새로 만드세요)

```bash
NEXT_PUBLIC_GA_ID=G-C8E4VZ883Y
```

배포 환경(Vercel 등)에서도 동일한 환경변수를 설정합니다.

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
  if (won < 500_000) return "100k_500k";
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

웹 브라우저에서는 `https://torich.app` 처럼 정상적인 URL이 GA에 찍힙니다.
Capacitor 앱에서는 내부적으로 `capacitor://localhost` 라는 가상 주소를 사용합니다.
GA는 히트(이벤트)를 받긴 받지만, 호스트명이 `localhost`로 찍혀서 웹과 앱 트래픽이 섞여 보입니다.

**해결책**: 모든 이벤트에 `platform` 파라미터를 붙이고 (7.3의 래퍼가 자동으로 처리),
GA4 보고서에서 `platform` 파라미터로 필터링해서 구분해서 봅니다.

### 문제 2: iOS에서 세션이 짧게 끊길 수 있다

iOS에서는 Safari의 ITP(Intelligent Tracking Prevention) 정책으로 인해
쿠키 기반 세션이 예상보다 짧게 끊길 수 있습니다.
이 때문에 재방문 유저가 신규 유저로 잘못 카운트될 수 있습니다.

**해결책 (선택)**: 로그인한 유저에 한해 `user_id`를 GA에 설정하면 세션과 무관하게 동일 유저로 인식합니다.
단, user_id는 반드시 **해시된 UUID**(Supabase user.id를 sha256 등으로 해싱)만 사용해야 합니다. 이메일 등 PII는 절대 안 됩니다.

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

## 11. 구현 순서 체크리스트

아래 순서대로 하나씩 체크하면서 진행합니다.

**기본 활성화**
- [x] `.env.local`에 `NEXT_PUBLIC_GA_ID=G-C8E4VZ883Y` 추가 ✅
- [x] `.env.production`에 `NEXT_PUBLIC_GA_ID=G-C8E4VZ883Y` 추가 ✅
- [ ] 배포 환경(Vercel 대시보드)에도 동일 환경변수 추가 → 수동으로 설정 필요
- [x] `app/layout.tsx` 주석 해제 + 환경변수 방식으로 변경 ✅
- [ ] 앱 실행 후 GA4 DebugView에서 `page_view` 이벤트 수신 확인

**공통 유틸 추가**
- [x] `app/lib/analytics.ts` 파일 생성 ✅

**이벤트 연결**
- [x] PR 1 — 인증: `login_click`, `login_success`, `logout_click` ✅
- [x] PR 2 — 투자 핵심: `investment_add_click`, `investment_create_success`, `investment_delete` ✅
- [x] PR 3 — 알림: `notification_permission_prompt/granted/denied`, `notification_open` ✅
- [x] PR 4 — 나머지: 온보딩, 통계, 캘린더, 에러, 테마 ✅

**GA4 콘솔 설정**
- [ ] `investment_create_success`를 전환(Conversion)으로 표시
- [ ] 활성화 퍼널(6.1) 탐색 보고서 생성
- [ ] platform 세그먼트 보고서 생성

**개인정보**
- [ ] `app/settings/privacy/page.tsx`에 GA 사용 고지 문구 추가
- [ ] 앱스토어 심사 시 Data Collection 섹션 체크

**검증**
- [ ] 배포 후 24시간 후 이벤트 카운트 정상 수집 확인
- [ ] `investment_create_success` 전환이 집계되는지 확인
- [ ] platform 파라미터가 web/ios/android로 제대로 구분되는지 확인

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
