# 통계(/stats) 기능 상세 분석

> 이 문서는 토리치(Torich) 앱의 **통계 화면(`/stats`)** 구현을 실제 코드 기준으로 분석한 것이다. 모든 계산식은 코드에서 직접 인용했으며, 추정·일반론은 배제했다. 분석 시점의 `develop/hansol` 브랜치 기준.

---

## ⚠️ 분석 중 발견한 중요 사실 (먼저 읽을 것)

작업 지시에 포함된 일부 항목은 **현재 통계 화면에서 더 이상 렌더링되지 않거나, 코드 자체가 존재하지 않는다.** 문서를 오해 없이 읽기 위해 먼저 정리한다.

1. **복리/예상수익 차트(`CompoundChartSections/*`, `useCompoundChartData`, `generateCompoundChartData`)는 현재 `/stats` 화면에 연결되어 있지 않다 (orphaned/legacy).**
   - `app/stats/page.tsx` → `StatsView` → `StatsContent` 어디에서도 `<CompoundChart>` 를 import/렌더하지 않는다.
   - 저장소 전체에서 `<CompoundChart` JSX 사용처는 `CompoundChartSections/` 폴더 **내부 상호 참조뿐**이다. (`grep -rn "<CompoundChart" app` → 폴더 내부만 매칭)
   - `useCompoundChartData` 의 호출자는 `CompoundChart.tsx` 단 하나이며, 그 `CompoundChart.tsx` 의 호출자가 없다.
   - `selectedYear`(연차 선택) prop을 넘기는 코드도 저장소에 존재하지 않는다(`grep -rn "selectedYear"` → 컴포넌트 정의 내부만).
   - 즉, **복리 차트 코드는 살아있으나 통계 화면에서 죽어 있는(dead) 컴포넌트 트리**다. 본 문서 §4에서 코드는 그대로 분석하되, "현재 화면에 표시되지 않음"을 명시한다.

2. **"만기 지난 상품 현금 보관 안내(CashHoldItemsSheet)" 컴포넌트는 저장소에 존재하지 않는다.**
   - `find . -iname "*cashhold*"` → 결과 없음. `grep -rn "CashHold"` → 결과 없음.
   - "만기 후 현금 보관" 개념은 오직 `compound-chart.ts` 내부의 **주석 + 계산 동작**으로만 남아 있다(§4.4).
   - git 이력상 `ExpectedAssetSection` 은 과거에 `onShowCashHold` 콜백과 "만기가 지난 상품은 현금으로 보관한다고 가정했어요." 문구, "예상 자산" 헤더를 가졌으나, 커밋 `ee7af9f feat(stats): 통계 화면을 적립 원금 기준으로 재구성함` 에서 **"지금까지 모은 원금"(실제 납입 원금) 기준으로 전면 재구성**되며 제거되었다.

3. **현재 통계 화면은 "예상 자산/수익률"을 의도적으로 보여주지 않는다.**
   - 현재 `ExpectedAssetSection` 헤더는 `지금까지 모은 원금` 이고, 표시 값은 추정 미래가치가 아니라 **실제 납입 원금 누적(`totalPaidPrincipal`)** 이다.
   - 화면 하단에 FAQ 링크 "토리치는 왜 수익률을 안 보여주나요? →" 가 있고, 해당 FAQ(`why-no-rate`)는 "진행률과 통계 모두 실제로 넣은 원금을 기준으로 보여드려요"라고 설명한다(`app/lib/faq-content.ts:81`).

> **결론:** 지시서의 "예상 자산 계산(연차별 1/3/5/10/30년)·복리 차트·현금 보관 안내"는 **현재 운영 통계 화면의 기능이 아니라, 같은 저장소에 남아 있는 복리 계산 유틸/legacy 컴포넌트의 사양**이다. 본 문서는 (A) 현재 실제로 렌더링되는 통계 화면과 (B) legacy 복리 차트 코드를 **명확히 구분**하여 둘 다 기술한다.

---

## 1. 기능 개요

`/stats` 는 사용자의 적립/투자 기록(`records`)과 납입 이력(`payment_history`)을 집계해 **"얼마나 꾸준히 모았는가"** 를 보여주는 탭 화면이다. 수익률·예상 미래가치 같은 추정 숫자 대신 **실제 납입 원금**과 **완료율**을 핵심 지표로 삼는다.

현재 화면이 실제로 렌더링하는 섹션(위→아래, `StatsContent.tsx`):

| 순서 | 섹션 | 조건부 표시 | 핵심 지표 |
|---|---|---|---|
| 1 | 목적 진척 (`StatsGoalProgressSection`) | 활성 목적(goal) 1개 이상일 때만 | 목적별 현재값·진행률·D-day |
| 2 | 지금까지 모은 원금 (`ExpectedAssetSection`) | `hasRecords` 일 때만 | `totalPaidPrincipal`, 월 적립액 |
| 3 | 이번 달 납입 현황 (`MonthlyStatusSection`) | 항상 | 완료/전체 금액, 진행 바, 지난달 대비 |
| 4 | 투자 상태 요약 (`ModeBreakdownSection`) | 목표형·적립형이 **둘 다** 있을 때만 | 만기 임박/진행률/streak |
| 5 | 완료율 (`CompletionRateSection`) | 항상 | 기간별 완료율 % + 월별 막대 차트 |
| 6 | FAQ 링크 | 항상 | "왜 수익률을 안 보여주나요?" |

데이터 출처:
- `records` 테이블 → `useStatsData` (전체 `records` + `isCompleted` 필터로 거른 `activeRecords`)
- `payment_history` 테이블 → `usePaymentHistory` (`completedPayments`=자동 체크, `retroactivePayments`=소급 체크)
- 목적(goal) → `StatsGoalProgressSection` 내부에서 `useGoals` + `useGoalsProgress` 로 독립 조회

진입 시 `track('stats_view', { filter })` 1회 전송, 인증 안 된 사용자는 `/login` 으로 `router.replace`.

---

## 2. 화면 구성 — 컴포넌트 트리

### 2.1 전체 트리 (현재 렌더링되는 경로)

```
app/stats/page.tsx  (StatsPage, 'use client')
│  ├─ 훅 호출: useStatsData, usePaymentHistory, useStatsPageUI,
│  │           usePeriodFilter, useStatsCalculations, useChartData
│  └─ track('stats_view') on mount
│
└─ <StatsView>                         app/components/StatsSections/StatsView.tsx
   │  - isLoading → CircleNotch 스피너 (full-screen)
   │  - !user → null (page에서 이미 /login redirect)
   │  - useMonthlyContribution(records, totalMonthlyPayment) → contributionItems
   │  - 앱바(고정 헤더) + Safe Area 패딩 처리
   │
   ├─ <header> → <StatsHeader>          "통계" h1 (StatsHeader.tsx)
   │
   ├─ <StatsContent>                    StatsContent.tsx
   │  │  - delta = getMonthlyPaymentDelta(activeRecords, completed, retroactive)  (useMemo)
   │  │
   │  ├─ <StatsGoalProgressSection>     activeGoals.length>0 일 때만 렌더 (자체 데이터 조회)
   │  ├─ {hasRecords && <ExpectedAssetSection>}
   │  ├─ <MonthlyStatusSection thisMonth delta>
   │  ├─ {hasRecords && <ModeBreakdownSection goalStats habitStats>}  ← 내부에서 단일모드면 null
   │  ├─ <CompletionRateSection ...>    드롭다운 기간필터 + DateRangePicker + recharts BarChart
   │  └─ <Link href="/faq">             "토리치는 왜 수익률을 안 보여주나요? →"
   │
   └─ {showContributionSheet && <MonthlyContributionSheet>}   바텀시트 (월 투자 내역)
```

### 2.2 Props 전달 구조 (그룹화)

`StatsPage` → `StatsView` → `StatsContent` 로 props가 **그룹 객체**(`data` / `payment` / `ui` / `filter` / `calculations` / `chart`)로 묶여 내려간다. (`StatsView.tsx:64-73`, `StatsContent.tsx:58-65`)

- `data`: `{ records, activeRecords, hasRecords }`
- `payment`: `{ completedPayments, retroactivePayments }`
- `ui`: `{ showContributionSheet, handleCloseContribution, handleShowContribution }`
- `filter`: `{ periodPreset, setPeriodPreset, periodLabel, customDateRange, setCustomDateRange, handleCustomPeriod }`
- `calculations`: `{ totalPaidPrincipal, totalMonthlyPayment, thisMonth, goalStats, habitStats }`
- `chart`: `{ periodCompletionRate, chartData, chartBarColor }`

> 참고: `StatsView`/`StatsContent` 의 `filter`·`chart` props는 타입이 `any`/`any[]` 로 느슨하게 선언되어 있다(`StatsView.tsx:37-61`). 실제 타입은 `usePeriodFilter`/`useChartData` 반환 타입이다.

### 2.3 legacy 복리 차트 트리 (현재 미연결)

```
<CompoundChart>                        CompoundChartSections/CompoundChart.tsx   ← 호출자 없음
│  - useCompoundChartData({investments, selectedYear, totalMonthlyPayment})
│  - chartData.length===0 → "투자를 추가하면 차트가 표시됩니다"
├─ <CompoundChartGraph>                LineChart: 원금(점선)·총자산·예상수익 + breakEven ReferenceLine
│   └─ <CompoundChartTooltip>          원금/예상수익/총자산 툴팁
└─ <CompoundChartSummary>              원금·예상수익·"⚡ N개월 복리 역전"
   (CompoundChartConfig.tsx: 축 포맷터·legend·margin 상수)
```

---

## 3. "예상 자산" 계산 — 현재 vs legacy

### 3.1 현재 화면의 "지금까지 모은 원금" (실제 납입 원금)

현재 `ExpectedAssetSection` 이 보여주는 값은 **예상 미래가치가 아니라 실제 납입 원금 누적**이다. 계산은 `useStatsCalculations` 의 `totalPaidPrincipal` (§7.1).

```
totalPaidPrincipal = Σ (record.monthly_amount × max(0, 경과개월))
```

- 경과개월 = `getElapsedMonths(getStartDate(record))` = `differenceInMonths(today, startDate)` (date-fns)
- 음수 방지로 `Math.max(0, ...)`
- 표시: `formatCurrency(totalPaidPrincipal)` → "X억 X만원" 형식 (`lib/utils.ts:13`)
- 보조 표시: `월 {formatCurrency(totalMonthlyPayment)}씩 적립 중` 버튼 → 클릭 시 `MonthlyContributionSheet` 오픈

연차별(1/3/5/10/30년) 산출 로직은 **현재 화면에 존재하지 않는다.** 아래 §3.2/§4 는 같은 저장소의 legacy 복리 계산기 사양이다.

### 3.2 legacy 복리 예상 자산 — 연차별 산출 의사코드

legacy `generateCompoundChartData(investments, selectedYear, totalMonthlyPayment)` 는 `selectedYear`(년) 길이만큼 월 단위 시뮬레이션을 돌려 마지막 데이터포인트를 "예상 자산"으로 본다. `selectedYear` 자리에 1/3/5/10/30 등을 넣는 호출부가 현재 없으므로 **"연차별 1/3/5/10/30년"은 의도된 사용 패턴일 뿐 현 코드의 호출 실체는 없다.** 알고리즘 의사코드(`compound-chart.ts:42-128` 기준):

```
function 예상자산(investments, 연차):
    months = 연차 × 12
    # 투자별 초기 상태
    for inv in investments:
        R         = inv.annual_rate ? inv.annual_rate/100 : 0.10   # 미설정 시 연 10% 가정
        월이율     = R / 12
        만기개월P  = (inv.period_years>0) ? inv.period_years×12 : months  # 적립형은 전체기간
        balance   = 0

    for month in 1..months:
        # (1) 원금 누적 — 만기 전까지만 납입
        principal = Σ_inv ( month<=P ? inv.monthly_amount×month
                                     : inv.monthly_amount×P )
        # (2) 총자산 — 매월 복리
        totalAsset = 0
        for inv:
            if month <= 만기개월P:
                balance = balance×(1+월이율) + inv.monthly_amount
            # 만기 후: 이자 없이 balance 그대로 유지(현금 보관)
            totalAsset += balance
        # (3) 예상수익
        profit = totalAsset - principal

    return 마지막 month 의 { principal, totalAsset, profit }
```

`calculateChartSummary` 는 `chartData` 의 **마지막 원소**(`chartData[length-1]`)를 그대로 요약으로 반환한다(`compound-chart.ts:133-144`). 따라서 "N년차 예상 자산"은 곧 `selectedYear=N` 으로 시뮬레이션한 마지막 달의 `totalAsset`.

---

## 4. 복리 차트 (`compound-chart.ts`) — 실제 코드 인용

> 재확인: 이 차트는 **현재 `/stats` 에 렌더링되지 않는다.** 코드만 분석한다. 파일: `app/utils/compound-chart.ts`.

### 4.1 진입 가드 / 초기 상태

```ts
// compound-chart.ts:42-71
export function generateCompoundChartData(
  investments: Investment[],
  selectedYear: number,
  totalMonthlyPayment: number
): ChartDataPoint[] {
  if (investments.length === 0 || totalMonthlyPayment === 0) {
    return []
  }

  const months = selectedYear * 12
  const data: ChartDataPoint[] = []
  let breakEvenFound = false

  // 각 투자별로 월별 누적 자산을 추적 (적립형은 전체 기간 계속 납입)
  const investmentBalances: InvestmentBalance[] = investments.map((investment) => {
    const R = investment.annual_rate ? investment.annual_rate / 100 : 0.10
    const monthlyRate = R / 12
    const P =
      investment.period_years && investment.period_years > 0
        ? investment.period_years * 12
        : months

    return {
      investment,
      monthlyAmount: investment.monthly_amount,
      monthlyRate,
      maturityMonths: P,
      balance: 0, // 현재 시점의 자산
    }
  })
```

- `totalMonthlyPayment===0` 이면 빈 배열 → 빈 상태 UI.
- 연이율 미설정(`annual_rate` falsy) 시 **연 10%(0.10)** 로 가정. 월이율 = `R/12`.
- 만기개월 `P`: 목표형은 `period_years×12`, 적립형(null/0)은 `months`(=전체 시뮬 기간) → 끝까지 납입.

### 4.2 월별 루프 — 원금 누적

```ts
// compound-chart.ts:73-86
for (let month = 1; month <= months; month++) {
  // 원금 누적: 각 투자별로 만기 전까지만 납입 (적립형은 만기 없음)
  let principal = 0
  investments.forEach((investment) => {
    const P =
      investment.period_years && investment.period_years > 0
        ? investment.period_years * 12
        : months
    if (month <= P) {
      principal += investment.monthly_amount * month
    } else {
      principal += investment.monthly_amount * P
    }
  })
```

만기 후에는 원금을 `monthly_amount × P` 로 고정(더 이상 납입 안 함).

### 4.3 월별 루프 — 총자산 복리: `balance = balance×(1+월이율) + 월금액`

```ts
// compound-chart.ts:88-103
  // 총 자산 계산: 각 투자별로 매월 복리 계산
  let totalAsset = 0

  investmentBalances.forEach((item) => {
    // 만기 전이면 복리 계산
    if (month <= item.maturityMonths) {
      // 이전 달 자산에 이자 추가 + 이번 달 납입액 추가
      item.balance = item.balance * (1 + item.monthlyRate) + item.monthlyAmount
    }
    // 만기 후에는 이자 없이 유지 (현금 보관)
    // balance는 이미 만기 시점에 계산되어 있으므로 그대로 유지

    totalAsset += item.balance
  })

  const profit = totalAsset - principal
```

핵심 점화식: **`balance ← balance × (1 + 월이율) + 월금액`** (만기 전 매월). 예상수익 = `totalAsset − principal`.

### 4.4 만기 후 현금 보관

위 코드의 `if (month <= item.maturityMonths)` 블록을 **빠져나오면 `item.balance` 를 갱신하지 않는다.** 즉 만기 시점의 잔액이 이후 그대로 누적 합산되며, 이자도 추가 납입도 없다. 주석이 이를 "이자 없이 유지 (현금 보관)"으로 명시한다. → 적립형(`period_years` null/0)은 만기개월 `P=months` 라 마지막 달까지 계속 복리, 목표형은 `period_years×12` 이후 동결.

> 별도의 "현금 보관 안내 시트(CashHoldItemsSheet)"는 존재하지 않으며, 이 동작은 차트 라인에만 반영된다.

### 4.5 손익분기(breakEven) 마커

```ts
// compound-chart.ts:105-128
  // 복리 역전 포인트 찾기 (총 자산이 원금을 처음 추월하는 시점)
  const isBreakEven =
    !breakEvenFound && totalAsset > principal && month > 1

  if (isBreakEven) {
    breakEvenFound = true
  }

  // 라벨 생성
  const monthLabel = generateMonthLabel(month)

  data.push({
    month,
    year: Math.floor(month / 12),
    monthLabel,
    principal,
    totalAsset,
    profit,
    breakEven: isBreakEven,
  })
}

return data
```

- breakEven 조건: `totalAsset > principal && month > 1` 을 **최초로** 만족한 달(`!breakEvenFound`)에 한 번만 `true`.
- `findBreakEvenPoint(chartData)` = `chartData.find(d => d.breakEven)` (`compound-chart.ts:149-151`).

### 4.6 라벨 생성기

```ts
// compound-chart.ts:30-37
function generateMonthLabel(month: number): string {
  if (month % 12 === 0) {
    return `${month / 12}년`
  } else if (month === 1 || month === 6 || month % 12 === 6) {
    return `${month}개월`
  }
  return ''
}
```

→ 12의 배수는 "N년", 1·6·(12k+6)개월은 "N개월", 그 외는 빈 라벨(축 간소화).

### 4.7 차트 라인 ↔ dataKey 매핑 (`CompoundChartGraph.tsx`)

| 라인 | dataKey | 스타일 | 색상 토큰 |
|---|---|---|---|
| 원금 | `principal` | `strokeWidth 1.5`, `strokeDasharray "4 4"` (점선) | `chartColors.principal` |
| 총 자산 | `totalAsset` | `strokeWidth 2` 실선 | `chartColors.totalAsset` |
| 예상 수익 | `profit` | `strokeWidth 2.5` 실선(가장 두꺼움) | `chartColors.profit` |
| 손익분기 | — | `ReferenceLine x={breakEvenPoint.month}`, `strokeDasharray "2 2"` | `chartColors.breakEven` |

요약 카드(`CompoundChartSummary.tsx`): 원금=`formatCurrency`, 예상수익=`formatSignedProfit`, 손익분기="⚡ {month}개월". 툴팁(`CompoundChartTooltip.tsx`): `year>0`면 "N년 ", `month%12`개월 라벨 합성.

---

## 5. 이번 달 납입 현황 (`MonthlyStatusSection`)

### 5.1 데이터: `getThisMonthStats` (utils/stats.ts:76-107)

```ts
const events = getPaymentEventsForMonth(investments, year, month)   // 이번 달 모든 납입 이벤트
let totalPayment = 0, completedPayment = 0
for (const e of events) {
  totalPayment += e.monthlyAmount
  if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
    completedPayment += e.monthlyAmount
  }
}
const progress = totalPayment > 0 ? Math.round((completedPayment / totalPayment) * 100) : 0
const remainingPayment = totalPayment - completedPayment
```

- `investments` = `activeRecords` (만기 안 지난 것만). `useStatsCalculations.ts:64`.
- "이벤트" = 해당 월에 `investment_days` 각 날짜마다 1건(시작일·만기일 범위 내, `getPaymentEventsForMonth`, §6.1).
- **금액 기준** 진행률(`progress`). 완료 판정은 `payment_history` 자동 체크(`completedPayments`)만 사용(소급분 미포함).

### 5.2 지난달 대비 델타: `getMonthlyPaymentDelta` (utils/stats.ts:246-316)

`StatsContent.tsx:79` 에서 `getMonthlyPaymentDelta(activeRecords, completedPayments, retroactivePayments)` 호출.

월별 합산 `sumForMonth(y, m)`:
- **auto**: `getPaymentEventsForMonth` 이벤트 중 `isPaymentCompleted` 인 것의 `monthlyAmount` 합 (event-based).
- **retro**: `retroactivePayments` 에서 prefix `"YYYY-MM-"` 로 시작하는 날짜가 있으면 그 record의 `monthly_amount` 1회 가산 (record-month당 최대 1건; 소급 엔트리 포맷 `${yearMonth}-01` 의존).
- 합계 = auto + retro.

`deltaAmount = thisMonthSum − lastMonthSum`. `hasComparison` = 지난달에 이벤트가 있었거나 지난달 소급 기록이 있을 때만 `true`.

> 주석 명시(stats.ts:241): 호출자는 **반드시 activeRecords(terminated 제외)** 를 넘겨야 함.

### 5.3 UI (MonthlyStatusSection.tsx)

- 제목: "이번 달 납입 현황"
- `{completedPayment}원 / {totalPayment}원` (toLocaleString)
- 진행 바: `<div style={{ width: `${thisMonth.progress}%` }}>` (bg-foreground-soft, `transition-all duration-500`)
- "남은 금액: {remainingPayment}원" (우측 정렬)
- `showDelta`(=`hasComparison`)일 때만 "지난달 대비 {deltaText}":
  - `deltaAmount>0` → `text-primary`, `+{n}원`
  - `deltaAmount<0` → `text-muted-foreground`, `{n}원`
  - `===0` → `text-foreground-muted`, "지난달과 동일"

---

## 6. 기간별 완료율 (`useChartData` + `CompletionRateSection`)

### 6.1 월별 완료율 계산식 — 핵심 빌딩블록

먼저 "이벤트" 정의 (`getPaymentEventsForMonth`, stats.ts:19-71):

```
for inv in investments:
  startDate = inv.start_date ?? inv.created_at
  endDate   = inv.period_years>0 ? startDate + period_years년 : null   # 적립형 만료 없음
  days      = inv.investment_days; if 비어있으면 skip
  daysInMonth = (해당 연·월 말일)
  for day in days:
    if day > daysInMonth: continue                 # 30일 없는 달 등 방어
    paymentDate = (year, month-1, day)
    if paymentDate < startDate: continue           # 시작 전 제외
    if endDate && paymentDate > endDate: continue  # 만기 후 제외
    events.push({investmentId, year, month, day, monthlyAmount, title, ...})
events.sort(by day)
```

월별 완료율 (`getMonthlyCompletionRates`, stats.ts:147-187) — **건수 기준**:

```
for i in 0..monthsBack-1:           # i=0 이번달, i=1 지난달 ...
  d = new Date(thisYear, thisMonth-i, 1)
  events = getPaymentEventsForMonth(...)
  completed = events 중 isPaymentCompleted 인 건수
  rate = events.length>0 ? Math.round(completed/events.length*100) : 0
  results.push({ yearMonth, monthLabel:`${month}월`, total:events.length, completed, rate })
```

커스텀 기간(`getMonthlyCompletionRatesForRange`, stats.ts:192-230)도 동일 공식이되, `from`~`to` 의 매 월을 `while (current <= to)` 로 순회.

> 차이 주의: **이번 달 현황(§5)은 금액 합 기준**, **완료율(§6)은 건수 기준**.

### 6.2 useChartData (hooks/chart/useChartData.ts)

```ts
// monthlyRates: 커스텀이면 range, 아니면 최근 effectiveMonths개월
const monthlyRates = isCustomRange && customDateRange?.from && customDateRange?.to
  ? getMonthlyCompletionRatesForRange(activeRecords, completedPayments, from, to)
  : getMonthlyCompletionRates(activeRecords, completedPayments, effectiveMonths)

// periodCompletionRate: 기간 전체 가중 평균 (건수 기준 합산 후 비율)
const totalEvents    = rates.reduce((s,r)=>s+r.total, 0)
const totalCompleted = rates.reduce((s,r)=>s+r.completed, 0)
periodCompletionRate = totalEvents>0 ? Math.round(totalCompleted/totalEvents*100) : 0

// chartData: 표시용 — 최신이 오른쪽에 오도록 reverse
chartData = [...monthlyRates].reverse().map(r => ({ name:r.monthLabel, rate:r.rate, completed:r.completed, total:r.total }))
```

- **`periodCompletionRate` 는 월별 rate의 단순 평균이 아니라**, 전 기간 `completed` 합 / `total` 합 (이벤트 가중).
- `monthlyRates` 는 i=0(이번달)이 배열 앞 → `reverse()` 로 차트에서 좌→우 시간순.
- `chartBarColor`: CSS 변수 `--foreground-soft` 읽음, SSR/미해결 시 `#9c9ea6` fallback (§8).

### 6.3 기간 필터 (`usePeriodFilter`, hooks/stats/usePeriodFilter.ts)

| preset | 의미 | effectiveMonths | periodLabel |
|---|---|---|---|
| `'1'` | 이번 달 | 1 | "이번 달" |
| `'3'` | 최근 3개월 | 3 | "최근 3개월" |
| `'6'` | 최근 6개월 (기본값) | 6 | "최근 6개월" |
| `'12'` | 최근 12개월 | 12 | "최근 12개월" |
| `'custom'` | 기간 선택 | 6 (fallback) | `"MM월 YYYY - MM월 YYYY"` (range 유효 시) |

- 초기값 `'6'`.
- `isCustomRange` = `preset==='custom' && customDateRange.from && .to` 모두 존재.
- `effectiveMonths` = custom이면 6, 아니면 `parseInt(preset)`.
- `customDateRange` 초기값/`handleCustomPeriod`: `{ from: subDays(today,6), to: today }` (최근 7일).
- `setPeriodPreset` 호출 시 `track('stats_filter_change', { from, to })` 전송.

### 6.4 UI (`CompletionRateSection.tsx`)

- `DropdownMenu`: 이번 달 / 최근 3개월 / 최근 6개월 / 최근 12개월 / 기간 선택.
- `periodPreset==='custom'` 일 때 `<DateRangePicker>` 노출.
- `{periodCompletionRate}%` 대형 표시.
- recharts `<BarChart>` (`h-32`): `XAxis dataKey="name"`, `YAxis domain={[0,100]} width={28}`, `Bar dataKey="rate" radius={[4,4,0,0]}`.
- 각 `<Cell>` 의 `fillOpacity = 0.7 + (i / chartData.length) * 0.3` → 왼쪽(과거)이 옅고 오른쪽(최근)이 진함.
- 하단 캡션: "{periodLabel} 월별 완료율".

---

## 7. 통계 집계 (`useStatsCalculations`)

파일: `app/hooks/investment/calculations/useStatsCalculations.ts`. 입력 `{ records, activeRecords, completedPayments }`.

### 7.1 totalPaidPrincipal / totalMonthlyPayment (records 기준, lines 52-62)

```ts
totalPaidPrincipal = records.reduce((sum, record) => {
  const elapsedMonths = Math.max(0, getElapsedMonths(getStartDate(record)))
  return sum + record.monthly_amount * elapsedMonths
}, 0)
totalMonthlyPayment = records.reduce((sum, r) => sum + r.monthly_amount, 0)
```

> `totalPaidPrincipal` 은 **납입 이력(payment_history)과 무관**하게, `start_date(또는 created_at)` 부터 경과한 개월수 × 월납입액으로 추정한 누적 원금이다. 즉 실제 체크 여부가 아니라 "경과 시간 기반 가정". (`records` 전체 사용 — 완료된 목표 포함.)

### 7.2 thisMonth (line 64)

`getThisMonthStats(activeRecords, completedPayments)` 그대로 — §5.1.

### 7.3 goalStats (목표형, lines 67-117)

`goalRecords = activeRecords.filter(r => !isHabitMode(r))` (period_years>0).

- `count`: 목표형 개수.
- `lowestProgressItem`: 시간 대비 진행률 최저 1개. `progressPercent = totalMonths<=0 ? 0 : Math.min(100, Math.round(elapsedMonths/totalMonths*100))`, `totalMonths=(period_years??0)*12`. 동률이면 title 사전순 빠른 것.
- `nextMaturityItem`: `calculateEndDate(start, period_years)` 로 종료일 계산 → 가장 이른 만기 1개. `daysLeft = differenceInDays(startOfDay(endDate), today)`.

### 7.4 habitStats (적립형, lines 119-159)

`habitRecords = activeRecords.filter(r => isHabitMode(r))` (period_years null/0).

- `count`: 적립형 개수.
- `thisMonthCompletedCount` / `thisMonthTotalCount`: 이번 달 이벤트 중 완료 건수 / 전체 건수 (`getPaymentEventsForMonth` + `isPaymentCompleted`, 건수).
- `longestHabitItem`: 경과개월 최대 1개. 동률이면 title 사전순.

이들은 `ModeBreakdownSection` 에서만 소비되며, **목표형·적립형이 둘 다 존재할 때만** 표시(단일 모드면 `null` 반환으로 섹션 숨김, `ModeBreakdownSection.tsx:29`).

### 7.5 월 투자 내역 (`useMonthlyContribution`)

파일: `useMonthlyContribution.ts`. 입력 `{ items: records, totalAmount: totalMonthlyPayment }`.

```ts
contributionItems = items.map(item => ({
  id, title,
  initial: getInitial(item.title),                          // 첫 글자 대문자
  amount: item.monthly_amount,
  percentage: calculatePercentage(item.monthly_amount, totalAmount),  // round(amount/total*100), total=0이면 0
}))
```

→ `MonthlyContributionSheet` 바텀시트에서 종목별 월 적립액·비중(%) 리스트로 표시. 비어 있으면 "아직 등록된 투자가 없어요".

---

## 8. 차트 색상 — CSS 변수 동적 읽기

### 8.1 완료율 막대 색상 (`useChartData.chartBarColor`, useChartData.ts:56-64)

```ts
if (typeof window === 'undefined') return '#9c9ea6'      // SSR fallback
const root = getComputedStyle(document.documentElement)
const fromToken = root.getPropertyValue('--foreground-soft').trim()
return fromToken || '#9c9ea6'
```

### 8.2 legacy 복리 차트 색상 (`useCompoundChartData.chartColors`, useCompoundChartData.ts:54-79)

SSR fallback: grid `#E6E7E8`, axis/principal `#9C9EA6`, totalAsset/profit/breakEven `#16A34A`(=`#15803D` 아님; 코드상 모두 profitLine으로 통일).
클라이언트: `--foreground-subtle`(axis·principal), `--border-subtle`(grid), `--chart-profit`(totalAsset=profit=breakEven). 각 토큰 미해결 시 위 hex로 폴백.

### 8.3 `useChartColors` (hooks/chart/useChartColors.ts)

별도 훅으로 `--chart-profit`/`--chart-principal`/`--foreground-subtle`/`--border-subtle`/`--foreground` 를 읽어 `{profit, profitDark, principal, principalText, grid, axis, totalText}` 반환. **단, 통계 화면 컴포넌트에서 직접 import하는 곳은 확인되지 않음** (다크모드 대응 공용 차트 훅으로 보이나 stats 트리 미사용).

> 세 곳 모두 `getComputedStyle(document.documentElement).getPropertyValue(token)` 패턴으로 런타임에 CSS 변수를 읽어 라이트/다크 테마에 동적 대응한다. 의존 배열이 `[]` 이므로 마운트 시 1회 계산(테마 토글 즉시 반영은 안 됨).

---

## 9. 사용 훅 표 (입력 / 출력 / 책임)

| 훅 | 입력 | 출력 | 책임 |
|---|---|---|---|
| `useStatsData` | (auth user) | `user, records, activeRecords, isLoading, router` | `records` 테이블 `select('*')` 조회, `isCompleted`로 `activeRecords` 필터, 미인증 처리용 router 반환 |
| `usePaymentHistory` | (auth user) | `completedPayments, retroactivePayments, isLoading, togglePayment, ...` | `payment_history` 조회 → `is_retroactive` 기준 자동/소급 Map(`recordId→Set<YYYY-MM-DD>`) 구성 |
| `useStatsPageUI` | `recordsLength` | `showContributionSheet, hasRecords, handleShow/CloseContribution` | 월 투자 내역 바텀시트 open/close, `hasRecords` 플래그 |
| `usePeriodFilter` | — | `periodPreset, setPeriodPreset, customDateRange, setCustomDateRange, isCustomRange, effectiveMonths, periodLabel, handleCustomPeriod` | 완료율 기간 필터 상태 + 라벨 + `stats_filter_change` 트래킹 |
| `useStatsCalculations` | `records, activeRecords, completedPayments` | `totalPaidPrincipal, totalMonthlyPayment, thisMonth, goalStats, habitStats` | 누적 원금/월납입/이번달/목표형·적립형 집계 (모두 `useMemo`) |
| `useMonthlyContribution` | `items(records), totalAmount` | `contributionItems` | 종목별 월 적립액·비중 VM 생성 |
| `useChartData` | `activeRecords, completedPayments, isCustomRange, effectiveMonths, customDateRange` | `monthlyRates, periodCompletionRate, chartData, chartBarColor` | 월별/기간 완료율 + 막대 차트 데이터·색상 |
| `useCompoundChartData` *(legacy, 미연결)* | `investments, selectedYear, totalMonthlyPayment` | `chartData, summary, breakEvenPoint, chartColors` | 복리 시뮬 데이터·요약·역전점·색상 |
| `useChartColors` *(stats 미사용)* | — | `{profit, profitDark, principal, ...}` | CSS 변수 기반 공용 차트 색 |
| `StatsGoalProgressSection` 내부: `useGoals`, `useGoalsProgress` | `userId / activeGoals, records, payments` | `goals` / `progressMap` | 목적별 현재값·진행률·D-day (별도 조회) |

---

## 10. 상태별 UI / 엣지 케이스

- **로딩**: `isLoading || historyLoading` → `StatsView` 가 풀스크린 `CircleNotch` 스피너만 렌더. (`StatsView.tsx:80-86`)
- **미인증**: `!isLoading && !user` → `router.replace('/login')` 후 `null` (`page.tsx:56-59`). `StatsView` 도 `!user` → `null` 방어.
- **기록 없음(`hasRecords=false`)**: `ExpectedAssetSection`·`ModeBreakdownSection` 미렌더. `MonthlyStatusSection`(0원/0원)·`CompletionRateSection`(0%, 빈 막대)·FAQ 링크는 그대로 표시.
- **목적 없음**: `StatsGoalProgressSection` 자체가 `activeGoals.length===0 → null`.
- **단일 모드**: 목표형만 또는 적립형만이면 `ModeBreakdownSection` → `null` (혼재 시에만 노출).
- **이번 달 예정 없음**: `getThisMonthStats` total=0 → progress 0%, "남은 금액 0원". `ModeBreakdownSection` 적립형 칸은 `thisMonthTotalCount===0` 시 "이번 달 예정 없음".
- **지난달 비교 불가**: `hasComparison=false` → 델타 라인 숨김.
- **`investment_days` 미설정 record**: `getPaymentEventsForMonth` 에서 이벤트 0 → 완료율/현황 합산에서 사실상 제외(원금 누적 `totalPaidPrincipal` 에는 여전히 포함).
- **`annual_rate` 0/미설정**(legacy 차트): 연 10% 가정.
- **`totalMonthlyPayment===0`**(legacy 차트): 빈 배열 → "투자를 추가하면 차트가 표시됩니다".
- **금액 0 / NaN 포맷**: `formatCurrency` → "0원". `formatSignedProfit` → 양수 "+ …", 0/NaN "0원".
- **말일 방어**: 31일·30일 등 없는 달은 `getPaymentEventsForMonth` 의 `day > daysInMonth` 가드로 이벤트 생성 안 함.

---

## 11. 분석 이벤트 (`track`)

`track(event, params)` 는 GA4 이벤트 전송(플랫폼 자동 첨부, 실패해도 앱 무중단). `app/lib/analytics.ts:26`.

| 이벤트 | 발생 위치 | 파라미터 | 비고 |
|---|---|---|---|
| `stats_view` | `page.tsx:36` `useEffect([])` | `{ filter: periodPreset }` | 화면 진입 1회만 (마운트 시점 preset='6' 기본) |
| `stats_filter_change` | `usePeriodFilter.ts:23` `setPeriodPreset` | `{ from, to }` | 기간 필터 변경 시마다 |

> 납입 토글 관련(`payment_complete` / `payment_uncheck` / `payment_complete_bulk`)은 `usePaymentHistory` 내부 이벤트로, 통계 화면이 아니라 체크리스트 동작에서 발생한다(통계 화면은 `completedPayments` 를 읽기만 함).

---

## 12. 관련 DB 테이블·컬럼

### 12.1 `records` (= 적립/투자 기록, 클라이언트가 Supabase SDK로 직접 조회)

`useStatsData` 가 `supabase.from('records').select('*').order('created_at', desc)`. 통계에서 실제 사용하는 컬럼:

| 컬럼 | 타입 | 통계에서의 용도 |
|---|---|---|
| `id` | uuid | 이벤트/완료 매칭 키 |
| `title` | text | 종목명, initial, ModeBreakdown 표시 |
| `monthly_amount` | number | 원금/현황/완료율 금액·비중의 기준 |
| `period_years` | number \| null | 목표형/적립형 판별(`isHabitMode`), 종료일·진행률 |
| `annual_rate` | number | (legacy 복리 차트) 월이율 |
| `investment_days` | number[] \| null | 월별 납입 이벤트 날짜 |
| `start_date` | string \| null | 경과개월·이벤트 시작 기준(없으면 `created_at`) |
| `created_at` | string | start_date 폴백 / 정렬 |
| `unit_type`, `monthly_shares` | string / number\|null | 이벤트 메타(`PaymentEvent`)에 포함 |
| `goal_id` | uuid \| null | (목적 진척은 별도 goals 조회 사용) |

> `final_amount`, `interest_rate`, `maturity_date`, `record_type`, `market`, `settled_at`, `is_custom_rate`, `notification_enabled` 등은 Row에 존재하나 **통계 화면 계산에는 직접 쓰이지 않는다**(`select('*')` 로 같이 받아옴).

### 12.2 `payment_history` (납입 이력)

`usePaymentHistory` 가 `select('record_id, payment_date, is_retroactive')`. (캡처 컬럼 `captured_price/shares` 는 통계 미사용.)

| 컬럼 | 타입 | 용도 |
|---|---|---|
| `record_id` | uuid (FK→records.id) | Map 키 |
| `payment_date` | string (`YYYY-MM-DD`) | 완료 판정 날짜. 소급분은 `YYYY-MM-01` 규약 |
| `is_retroactive` | boolean | 자동(completed) / 소급(retroactive) Map 분리 |
| `completed_at`, `created_at`, `captured_price`, `captured_shares`, `user_id`, `id` | — | 통계 직접 미사용 |

### 12.3 `goals` (목적 진척 섹션 전용)

`StatsGoalProgressSection` 이 `useGoals(userId)` 로 조회, `completed_at===null` 인 활성 목적만 `useGoalsProgress` 로 진행률 계산. (records FK: `records.goal_id → goals.id`.)

---

## 13. 파일 경로 인덱스 (`file_path:line`)

### 페이지 / 뷰
- `app/stats/page.tsx:13` — `StatsPage` 진입, 6개 훅 조합 + `stats_view` 트래킹 + `/login` 가드
- `app/components/StatsSections/StatsView.tsx:64` — 로딩 스피너·앱바·그룹 props 분배·`MonthlyContributionSheet` 마운트
- `app/components/StatsSections/StatsContent.tsx:58` — 섹션 배치, `getMonthlyPaymentDelta` 호출(`:79`), FAQ 링크(`:114`)
- `app/components/StatsSections/StatsHeader.tsx:3` — "통계" 타이틀

### 섹션 컴포넌트
- `app/components/StatsSections/StatsGoalProgressSection.tsx:16` — 목적 진척(별도 goals 조회), `:42` 빈 가드
- `app/components/StatsSections/ExpectedAssetSection.tsx:10` — "지금까지 모은 원금"(=`totalPaidPrincipal`) + 월 적립 pill(`:25`)
- `app/components/StatsSections/MonthlyStatusSection.tsx:13` — 이번 달 현황·진행 바(`:36`)·델타(`:45`)
- `app/components/StatsSections/ModeBreakdownSection.tsx:25` — 목표형/적립형 요약, `:29` 단일모드 null
- `app/components/StatsSections/CompletionRateSection.tsx:30` — 기간 드롭다운(`:44`)·BarChart(`:77`)·Cell opacity(`:83`)
- `app/components/StatsSections/MonthlyContributionSheet.tsx:14` — 월 투자 내역 바텀시트

### legacy 복리 차트 (현재 미연결)
- `app/utils/compound-chart.ts:42` — `generateCompoundChartData`(월 루프), `:95` 복리 점화식, `:97` 현금 보관 주석, `:106` breakEven, `:133` summary, `:149` findBreakEven, `:30` 라벨
- `app/hooks/chart/useCompoundChartData.ts:30` — 차트 데이터/요약/역전점/색상 메모
- `app/components/CompoundChartSections/CompoundChart.tsx:14` — 컨테이너(호출자 없음), `:26` 빈 상태
- `app/components/CompoundChartSections/CompoundChartGraph.tsx:29` — LineChart 3라인 + ReferenceLine(`:89`)
- `app/components/CompoundChartSections/CompoundChartSummary.tsx:14` — 원금/예상수익/복리역전 요약
- `app/components/CompoundChartSections/CompoundChartTooltip.tsx:11` — 툴팁
- `app/components/CompoundChartSections/CompoundChartConfig.tsx:3` — 축 포맷터·legend·margin

### 훅
- `app/hooks/investment/data/useStatsData.ts:19` — records 조회, `:63` activeRecords 필터
- `app/hooks/investment/calculations/useStatsCalculations.ts:47` — 집계, `:52` totalPaidPrincipal, `:64` thisMonth, `:67` goalStats, `:119` habitStats
- `app/hooks/investment/calculations/useMonthlyContribution.ts:19` — 월 투자 내역 VM
- `app/hooks/chart/useChartData.ts:25` — 완료율 데이터, `:39` periodCompletionRate, `:47` chartData reverse, `:56` chartBarColor
- `app/hooks/chart/useChartColors.ts:13` — 공용 차트 색(stats 미사용)
- `app/hooks/stats/usePeriodFilter.ts:19` — 기간 프리셋/라벨/`stats_filter_change`(`:23`)
- `app/hooks/stats/useStatsPageUI.ts:16` — 시트 토글·hasRecords
- `app/hooks/payment/usePaymentHistory.ts:13` — payment_history 조회, `:38` auto/retro Map 분리

### 유틸
- `app/utils/stats.ts:19` `getPaymentEventsForMonth`, `:76` `getThisMonthStats`, `:147` `getMonthlyCompletionRates`, `:192` `...ForRange`, `:246` `getMonthlyPaymentDelta`, `:112` `getPeriodTotalPaid`
- `app/utils/payment-completion.ts:3` — `isPaymentCompleted` (`YYYY-MM-DD` Set 조회)
- `app/utils/date.ts:32` `calculateEndDate`, `:50` `getElapsedMonths`, `:149` `isCompleted`
- `app/utils/finance.ts:11` — `calculatePercentage`
- `app/utils/string.ts:10` — `getInitial`
- `lib/utils.ts:13` `formatCurrency`, `:42` `formatSignedProfit`
- `app/lib/analytics.ts:26` — `track`, `:75` `monthOffset`
- `app/lib/faq-content.ts:81` — "수익률/예상 자산은 왜 안 보여주나요?"(FAQ 링크 대상)
- `app/types/investment.ts:74` `isHabitMode`, `:112` `getStartDate`

### DB 타입
- `types/database.types.ts:109` — `records` Row
- `types/database.types.ts:65` — `payment_history` Row
