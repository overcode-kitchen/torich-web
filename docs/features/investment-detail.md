# 투자 상세 / 편집 / 삭제 / 납입기록 (`/investment?id=`)

> 실제 구현 코드(2026-06 기준)를 한 줄씩 읽고 작성한 기능 명세서.
> 모든 라인 인용은 `파일경로:라인` 형식으로 표기하며, 계산식은 원문 그대로 인용한다.

---

## 1. 기능 개요

`/investment?id=<recordId>` 는 `records` 테이블의 단일 적립 항목 하나를 보여주는 **정적 라우트 + query param** 상세 화면이다. (Capacitor 정적 export 정책에 따라 동적 세그먼트 `[id]` 가 아니라 `?id=` 쿼리로 식별자를 전달한다.)

이 화면 하나가 `record_type` 에 따라 **세 종류의 항목**을 모두 처리한다.

- `investment` (주식·펀드 등 종목 기반) → `InvestmentDetailView`
- `savings` (예·적금) → `SavingsCashDetailView`
- `cash` (현금·기타) → `SavingsCashDetailView`

핵심 기능:

1. 항목 개요(아바타·제목·서브타이틀·달성 배지) 표시
2. 진행률/적립 streak 요약
3. 투자 정보(월 납입금·목표 기간·투자일·연이율 등) 표시
4. **월별 납입 기록** (자동 추적 + 소급 기록) 표시·토글
5. **인라인 편집**(투자 항목) 또는 **`/add?editId=` 편집 플로우 이동**(예적금·현금)
6. **삭제** (확인 모달 경유)
7. **record별 알림 on/off** 토글
8. 과거 시작일로 등록한 항목의 **소급 온보딩 시트** (`retroHint=1`)

진입점은 `app/investment/page.tsx`. 데이터는 전역 `InvestmentsProvider` 가 보유한 `records` 배열에서 `id` 로 찾는다(별도 단건 fetch 없음).

---

## 2. 진입 & `record_type` 분기

### 2.1 진입 가드 (`app/investment/page.tsx`)

`InvestmentDetail` 컴포넌트(`Suspense` 로 감쌈 — `useSearchParams` 사용 때문)는 다음 순서로 동작한다.

```
app/investment/page.tsx:25-27
  const rawId = searchParams.get('id')
  const id = rawId && rawId.trim() !== '' ? rawId : null
  const item = id !== null ? (records.find((r) => r.id === id) ?? null) : null
```

- `records` 는 `useInvestmentsContext()` 에서 가져온 전역 배열(`app/investment/page.tsx:19`).
- `updateInvestment`, `deleteInvestment` 도 같은 컨텍스트에서 가져온다.
- `goBack` 은 `useFlowBack({ rootPath: '/', enableHistoryFallback: true })` (`app/investment/page.tsx:20-23`).

가드용 `useEffect` 3개(`app/investment/page.tsx:29-45`):

1. `id === null` → `router.replace('/')` (id 누락 즉시 홈으로)
2. `!authLoading && !user` → `router.replace('/')` (비로그인)
3. `!dataLoading && user && id !== null && records.length > 0 && item === null` → `router.replace('/')` (데이터 로드 완료됐는데 해당 id가 records에 없음 = 삭제된/존재하지 않는 항목)

로딩/대기 상태는 모두 중앙 스피너(`CircleNotch animate-spin`)로 렌더(`:52-74`). `mainStyle` 은 네이티브 앱에서만 Safe Area 패딩 적용(`:47-50`).

### 2.2 분기 로직

```
app/investment/page.tsx:77
  if (getRecordType(item) !== 'investment') {
    return <SavingsCashDetailView ... />
  }
  return <InvestmentDetailView ... />
```

`getRecordType` 은 `record.record_type ?? 'investment'` (구버전 데이터 호환, `app/types/investment.ts:59-61`).

| 분기 | 컴포넌트 | 편집 방식 | 진행률 의미 | 차트/종목 |
|---|---|---|---|---|
| `investment` | `InvestmentDetailView` | **인라인 편집**(같은 화면) | 목표 기간 기반 % | 종목 아바타·시세 동기화 있음 |
| `savings` | `SavingsCashDetailView` | `/add?editId=&field=` 로 **이동** | 시작일~만기일 기반 % | 없음 |
| `cash` | `SavingsCashDetailView` | `/add?editId=&field=` 로 **이동** | 목표기간 설정 시만 %, 없으면 habit | 없음 |

#### onDelete 콜백 차이

- 투자: `await deleteInvestment(item.id)` → `router.replace('/')` (`:97-100`)
- 예적금/현금: 동일하지만 `SavingsCashDetailView` 내부 `useSavingsCashDetail` 의 `handleDelete` 가 `isDeleting` 상태를 감싸 호출(`:82-87`)

#### 화면 구조 차이

| 항목 | 투자 상세 | 예적금/현금 상세 |
|---|---|---|
| 스캐폴드 | 직접 fixed header + scroll container | `SubPageScaffold` 사용 |
| 헤더 메뉴 | 알림 토글 + 수정/삭제 드롭다운 | 수정/삭제 드롭다운만(알림 토글 없음) |
| 수정 | DropdownMenu→`setIsEditMode(true)` (인라인) | DropdownMenu→`router.push('/add?editId=')` |
| 정보 행 탭 | 없음 | 행 탭 시 `/add?editId=&field=<필드>` |
| 만기 수령액 카드 | 없음 | 예적금에서 표시 (단리 추정) |
| 탭바 노출 | 항상 | **납입기록이 있을 때만** (`hasHistory`) |

---

## 3. 탭 구조 (개요 / 투자 정보 / 납입 기록)

### 3.1 InvestmentTabContext (`app/contexts/InvestmentTabContext.tsx`)

`TabType = 'overview' | 'info' | 'history'` (`:5`). Provider 가 다음을 보유:

- `activeTab` 상태(기본 `'overview'`, `:29`)
- 5개의 ref: `scrollContainerRef`, `overviewRef`, `infoRef`, `historyRef`, `titleRef` (`:30-34`)
- `handleTabClick(tab)` (`:36-57`)

`InvestmentDetailView` 와 `SavingsCashDetailView` 모두 export 시 `<InvestmentTabProvider>` 로 감싼다(`InvestmentDetailView.tsx:195-201`, `SavingsCashDetailView.tsx:37-43`).

### 3.2 스크롤 추적 (탭 클릭 → 부드러운 스크롤)

탭 클릭은 IntersectionObserver 가 아니라 **수동 offset 계산 + `scrollTo`** 다.

```
InvestmentTabContext.tsx:50-56
  const headerAndTabsHeight = 52 + 40
  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const currentScrollTop = container.scrollTop
  const offset = targetRect.top - containerRect.top + currentScrollTop - headerAndTabsHeight
  container.scrollTo({ top: offset, behavior: 'smooth' })
```

- `headerAndTabsHeight = 52 + 40` = 헤더(52px) + 탭바(40px) 보정.
- `setActiveTab(tab)` 만 호출 → **스크롤 위치에 따라 activeTab이 역추적되지는 않는다.** (스크롤로 다른 섹션에 도달해도 탭 하이라이트는 마지막 클릭 기준 유지.)
- `useInvestmentTabs.ts` (`app/hooks/investment/detail/useInvestmentTabs.ts`) 는 동일 로직의 **레거시 훅**(현재 상세 화면은 Context 버전을 사용; `titleRef` 없음).

### 3.3 스티키 타이틀 (`useScrollHeader`)

`useScrollHeader(titleRef)` (`app/hooks/ui/useScrollHeader.ts`) 가 `titleRef` 의 가시성을 IntersectionObserver 로 관찰:

```
useScrollHeader.ts:12-19
  setShowStickyTitle(!entry.isIntersecting)
  ... rootMargin: '-52px 0px 0px 0px'
```

- 제목 블록이 헤더(52px) 위로 스크롤되면 `showStickyTitle=true` → 상단 고정 헤더 중앙에 `item.title` 노출(`InvestmentDetailHeader.tsx:47-51`).
- 주석: IntersectionObserver `rootMargin` 은 calc/env 불가라서 px 고정값 52를 쓴다(`useScrollHeader.ts:14-16`).

### 3.4 탭바 마크업

투자 상세 탭바: `InvestmentDetailContent.tsx:53-90`. `sticky top: APP_HEADER_TOTAL_HEIGHT` (`= calc(env(safe-area-inset-top) + 48px)`, `app/constants/layout-constants.ts`). 3버튼(개요/투자 정보/납입 기록)이 `handleTabClick` 호출.

예적금/현금 탭바: `SavingsCashDetailView.tsx:111-152`, **`hasHistory` 가 true일 때만 렌더**(`:62-63`). `InvestmentViewOverview.tsx` 의 탭바는 미사용(정적 더미; 현재 흐름에 안 쓰임).

---

## 4. 사용 훅 표

### 4.1 투자(`investment`) 상세 경로

| 훅 | 입력 | 출력 | 책임 |
|---|---|---|---|
| `useInvestmentsContext` | — | `records, isLoading, updateInvestment, deleteInvestment` | 전역 records + UPDATE/DELETE DB 액션 (`app/contexts/InvestmentsContext.tsx`) |
| `useFlowBack` | `{rootPath:'/'}` | `goBack` | history.back 또는 루트 폴백 (`useFlowBack.ts`) |
| `useInvestmentTabContext` | — | `activeTab, handleTabClick, *Ref` | 탭/스크롤 (`InvestmentTabContext.tsx`) |
| `useScrollHeader` | `titleRef` | `showStickyTitle` | 스티키 헤더 타이틀 (`useScrollHeader.ts`) |
| `usePaymentHistory` | — | `completedPayments, retroactivePayments, toggle…, markAll…` | payment_history 전체 fetch + 토글/일괄 (`usePaymentHistory.ts`) |
| `useGlobalNotification` | — | `notificationOn`(read-only로 사용) | user_settings 전역 알림 (`useGlobalNotification.ts`) |
| `useInvestmentDetailUI` | — | `showDeleteModal, isEditMode, isDaysPickerOpen` + setter | 순수 UI boolean 3개 (`useInvestmentDetailUI.ts`) |
| `useInvestmentDetailHandlers` | item, onUpdate, onDelete, isEditMode, payments… | `investmentData, isDeleting, isUpdating, handleSave, handleCancel, handleDelete` | 저장/취소/삭제 오케스트레이션 (`useInvestmentDetailHandlers.ts`) |
| └ `useInvestmentData` | item, isEditMode, payments | 알림 상태 + 편집폼 + 계산 + 납입기록(가공) 합본 | 상세 데이터 집계 (`useInvestmentData.ts`) |
| &nbsp;&nbsp;└ `useNotificationToggle` | `item.id` | `notificationOn, toggleNotification` | record별 알림 (`useNotificationToggle.ts`) |
| &nbsp;&nbsp;└ `useInvestmentDetailEdit` | — | 편집 폼 값/세터/`initializeFromItem` | 임시 수정 상태 (`useInvestmentDetailEdit.ts`) |
| &nbsp;&nbsp;└ `useInvestmentCalculations` | item, isEditMode, edit* | startDate, endDate, progress, completed, elapsedMonths, totalPaidPrincipal, nextPaymentDate … | 진행률/경과/원금 계산 (`useInvestmentCalculations.ts`) |
| &nbsp;&nbsp;└ `usePaymentPagination` | autoHistory, itemId | `paymentHistory, hasMorePaymentHistory, loadMore` | 6→+10 페이징 (`usePaymentPagination.ts`) |
| └ `useInvestmentActions` | onUpdate, onDelete | `isDeleting, isUpdating, handleUpdate, handleDelete` | API 호출 + 로딩 상태 (`useInvestmentActions.ts`) |
| `useShareModeSync` | item | void | 종목 진입 시 시세 갱신 + 주수→금액 동기화 (`useShareModeSync.ts`) |
| `useRetroactiveOnboarding` | `{retroactivePaymentHistory}` | `isOpen, rangeStart, rangeEnd, monthsCount, onRecordNow, onLater` | 소급 안내 시트 (`useRetroactiveOnboarding.ts`) |
| `useInvestmentDaysPicker` | initialDays, onApply | `tempDays, isDirty, toggleDay, applyChanges, reset` | 투자일 선택 바텀시트 (`useInvestmentDaysPicker`) |

### 4.2 예적금/현금(`savings`/`cash`) 상세 경로

| 훅 | 입력 | 출력 | 책임 |
|---|---|---|---|
| `useSavingsCashDetail` | item, onDelete | 삭제상태 + maturity + totalPaidPrincipal + start/endDate + progress/completed + isHabitMode + 납입기록(auto/retro) + 토글 | 예적금/현금 상세 전체 (`useSavingsCashDetail.ts`) |
| └ `usePaymentHistory` | — | (동일) | payment_history 맵 + 토글 |
| └ `usePaymentPagination` | autoHistory, item.id | (동일) | 페이징 |
| `useInvestmentTabContext`, `useScrollHeader`(미사용 분기) | — | — | 탭/스크롤 |

> 예적금/현금 경로는 `useInvestmentDetailEdit`/`useInvestmentCalculations`/`useNotificationToggle` 를 쓰지 **않는다.** 진행률/만기/원금 계산을 `useSavingsCashDetail` 내부에서 직접 수행하고, 알림 토글 UI도 없다.

---

## 5. 계산 로직

### 5.1 투자 항목 계산 (`useInvestmentCalculations.ts`)

`startDate = getStartDate(item)` = `item.start_date ?? item.created_at` (`app/types/investment.ts:112-117`).

#### 표시값(편집 모드 우선)

```
useInvestmentCalculations.ts:31-47
  displayMonthlyAmount = isEditMode
    ? parseInt(editMonthlyAmount.replace(/,/g, '') || '0') * 10000
    : item.monthly_amount
  habitMode = isEditMode ? (editIsHabitMode ?? isHabitMode(item)) : isHabitMode(item)
  parsedEditPeriod = parseInt(editPeriodYears || '0')
  displayPeriodYears = isEditMode
    ? (habitMode ? null : parsedEditPeriod > 0 ? parsedEditPeriod : null)
    : (item.period_years && item.period_years > 0 ? item.period_years : null)
  displayAnnualRate = isEditMode ? parseFloat(editAnnualRate || '0') : item.annual_rate || 10
```

- 입력 단위는 **만원** → `* 10000` 으로 원 환산.
- `isHabitMode(item)` = `!item.period_years || item.period_years <= 0` (`types/investment.ts:74-76`). 즉 `period_years` 가 null/0이면 적립형(habit).

#### 만기일 (목표 종료일)

```
useInvestmentCalculations.ts:49-51
  endDate = displayPeriodYears ? calculateEndDate(startDate, displayPeriodYears) : null
```

`calculateEndDate` (`app/utils/date.ts:32-35`):

```
calculateEndDate(startDate, periodYears):
  if (!periodYears || periodYears <= 0) return null
  return addMonths(startDate, periodYears * 12)   // date-fns addMonths
```

→ **종료일 = 시작일 + (목표년수 × 12)개월.** 적립형이면 null.

#### 경과 개월수 / 남은 개월수

```
date.ts:50-53  getElapsedMonths(startDate) = differenceInMonths(today, startDate)
date.ts:41-44  getRemainingMonths(endDate) = differenceInMonths(endDate, today)
```

`useInvestmentCalculations.ts:54` `elapsedMonths = getElapsedMonths(startDate)` → 반환 시 `Math.max(0, elapsedMonths)` (`:80`).

#### 총 납입 원금

```
useInvestmentCalculations.ts:57
  totalPaidPrincipal = displayMonthlyAmount * Math.max(0, elapsedMonths)
```

> ⚠️ 이 `totalPaidPrincipal` 은 **실제 체크한 납입 횟수가 아니라 "경과 개월수 × 월금액"** 이다(가정상 매월 납입). 적립형/목표형 공통. (예적금/현금 경로의 `totalPaidPrincipal` 은 이와 다르게 **실제 완료 체크 수** 기준 — 5.3 참고.)

#### 진행률 / 완료 여부

```
useInvestmentCalculations.ts:59-64
  progress = displayPeriodYears ? calculateProgress(startDate, displayPeriodYears) : null
  completed = displayPeriodYears ? isCompleted(startDate, displayPeriodYears) : false
```

`calculateProgress` (`date.ts:61-70`):

```
calculateProgress(startDate, periodYears):
  if (!periodYears || periodYears <= 0) return null   // 적립형은 진행률 없음
  totalMonths = periodYears * 12
  elapsedMonths = getElapsedMonths(startDate)
  if (elapsedMonths <= 0) return 0
  if (elapsedMonths >= totalMonths) return 100
  return Math.round((elapsedMonths / totalMonths) * 100)
```

`isCompleted` (`date.ts:149-153`):

```
isCompleted(startDate, periodYears):
  endDate = calculateEndDate(startDate, periodYears)
  if (!endDate) return false
  return isAfter(new Date(), endDate)   // 오늘 > 종료일이면 완료
```

#### 다음 납입일

```
useInvestmentCalculations.ts:66-68
  nextPaymentDate = getNextPaymentDate(isEditMode ? editInvestmentDays : item.investment_days)
```

`getNextPaymentDate` (`date.ts:264-278`): `investment_days` 정렬 후 오늘(`currentDay`)보다 큰 첫 날 → 이번 달 그 날, 없으면 **다음 달의 가장 빠른 날**. `investment_days` 없으면 null.

### 5.2 ProgressSection 렌더 분기 (`ProgressSection.tsx`)

값은 props 우선, 없으면 `InvestmentDetailContext.investmentData` 에서(`:28-34`).

```
ProgressSection.tsx:36   if (startDate === undefined) return null
ProgressSection.tsx:39   if (habit || !endDate) { ...적립형 UI... }
ProgressSection.tsx:65   if (progress === null || progress === undefined) return null
                         ...목표형 UI(진행률 바)...
```

- **적립형/종료일 없음**: `🔥 {formatDuration(elapsedMonths)}째 적립 중` + `총 납입액 = formatCurrency(totalPaidPrincipal)`. `elapsedMonths<=0` 이면 `'이번 달부터 적립 시작'`.
- **목표형**: 진행률 % 바 + 시작/종료일(`formatSmartDate`). 완료 시 바 색 `bg-green-500`, 아니면 `bg-brand-500`.

`formatDuration` (`date.ts:8-26`): 개월수 → `"N년 M개월"` (0인 단위 생략, 둘 다 0이면 `"0개월"`).

### 5.3 예적금/현금 계산 (`useSavingsCashDetail.ts`)

`startDate = getStartDate(item)` (`:86`).

#### 종료일 분기

```
useSavingsCashDetail.ts:88-96
  if (record_type === 'savings' && maturity_date) return new Date(maturity_date)
  if (record_type === 'cash' && period_years > 0) return calculateEndDate(startDate, period_years)
  return null
```

→ 예적금은 **만기일(`maturity_date`)** 을 종료일로, 현금은 목표기간 설정 시 시작일+기간, 아니면 null(habit).

#### isHabitMode / 경과 / 진행률 / 완료

```
useSavingsCashDetail.ts:97-106
  isHabitMode = !endDate
  elapsedMonths = Math.max(0, getElapsedMonths(startDate))
  progress:
    if (!endDate) return null
    totalMonths = differenceInMonths(endDate, startDate)   // date-fns
    if (totalMonths <= 0) return 100
    raw = Math.round((elapsedMonths / totalMonths) * 100)
    return Math.min(100, Math.max(0, raw))
  completed = endDate ? new Date() >= endDate : false
```

> 투자 경로(`calculateProgress`)는 `periodYears*12` 로 totalMonths를 만들지만, 예적금 경로는 **실제 시작~만기 `differenceInMonths`** 로 계산한다(만기일 임의 지정 가능하므로). 둘은 별개 구현.

#### 누적 납입 원금 (예적금/현금 — 실제 체크 기준)

```
useSavingsCashDetail.ts:80-84
  const auto = completedPayments.get(item.id)?.size ?? 0
  const retro = retroactivePayments.get(item.id)?.size ?? 0
  return (auto + retro) * item.monthly_amount
```

→ **자동 완료 수 + 소급 완료 수**의 합 × 월금액. (투자 경로의 "경과개월×금액"과 의미가 다름.)

### 5.4 예적금 만기 단리식 (`app/utils/savingsMaturity.ts`)

`calculateSavingsMaturity(record)` — `maturity_date` 또는 `interest_rate` 가 없으면 `null`(`:39-41`). 만기일 파싱 실패 시 null(`:45-47`).

`monthsBetween` (`:18-23`):

```
months = (maturity.getFullYear()-start.getFullYear())*12 + (maturity.getMonth()-start.getMonth())
return Math.max(0, months)
```

`months <= 0` 이면 null(`:50-52`). 본 계산식(`:54-66`):

```
monthly   = record.monthly_amount
rate      = record.interest_rate / 100
principal = monthly * months
interest  = Math.round( (monthly * rate) / 12 * ( (months * (months + 1)) / 2 ) )
total     = principal + interest
```

문서 주석에 명시된 공식(`:25-32`):

> - 원금 = 매달금액 × n
> - 이자 = 매달금액 × (연이율/100) / 12 × n(n+1)/2
> - n = 가입~만기 개월 수
> - **세금·복리·우대금리 미반영 약식 단리·세전 추정값**

UI 표기: `SavingsCashInfoSection.tsx:92-112` — 만기 예상 수령액(`total`) + 넣은 원금(`principal`) + 예상 이자(`interest`) + 면책 문구("단리·세전 기준 약식 추정값").

---

## 6. 편집 모드 (투자 항목 인라인 편집)

> 예적금/현금은 인라인 편집이 없다. `SavingsCashDetailView` 의 정보 행/제목 탭 또는 드롭다운 "수정하기"는 모두 `router.push('/add?editId=<id>[&field=<필드>]')` 로 별도 편집 플로우로 이동한다(`SavingsCashDetailView.tsx:65-67, 88, 108, 169`).

### 6.1 임시 수정 상태 (`useInvestmentDetailEdit.ts`)

편집 폼은 **문자열 기반 로컬 state**:

- `editMonthlyAmount`(만원 단위 문자열), `editPeriodYears`, `editAnnualRate`, `editInvestmentDays:number[]`, `editIsHabitMode:boolean`, `isRateManuallyEdited` (`:34-39`)

입력 정제:

```
useInvestmentDetailEdit.ts:41-52
  handleNumericInput: value.replace(/[^0-9]/g,'') → setter
  handleRateInput:    value.replace(/[^0-9.]/g,'') (점 2개 이상이면 무시), setIsRateManuallyEdited(true)
```

초기화(`initializeFromItem`, `:54-62`):

```
  habit = isHabitMode(item)
  editMonthlyAmount = (item.monthly_amount / 10000).toString()   // 원→만원
  editPeriodYears   = habit ? '' : String(item.period_years)
  editAnnualRate    = (item.annual_rate || 10).toString()
  editInvestmentDays= item.investment_days || []
  editIsHabitMode   = habit
  isRateManuallyEdited = false
```

진입 시점 초기화는 `InvestmentDetailView.tsx:91-97` 의 `useEffect([isEditMode, item])`:

```
  if (isEditMode) { investmentData.initializeFromItem(item); setIsDaysPickerOpen(false) }
```

### 6.2 편집 UI

`isEditMode` 일 때 `InvestmentDetailContent.tsx`:

- 개요: "종목명은 수정할 수 없습니다" 안내(`InvestmentDetailOverview.tsx:59-60`).
- `ProgressSection` **숨김**(`:92-95` `!isEditMode &&`).
- `InfoSection` 이 편집 폼으로 전환(`InfoSection.tsx`):
  - 월 투자금: `InvestmentField` editMode, 단위 "만원" (`:69-77`)
  - 목표 기간: `PeriodInput` + habit 토글. habit ON 시 `editPeriodYears=''` 로 클리어(`:80-95`)
  - 매월 투자일: 칩 + "추가" 버튼 → `setIsDaysPickerOpen(true)` (`InvestmentDaysField.tsx:19-50`)
- 하단 고정 액션 바 `InvestmentDetailActions`(취소/저장, `InvestmentDetailContent.tsx:105-111`).
- 투자일 피커 시트: `isEditMode && isDaysPickerOpen` 일 때(`:113-124`), `useInvestmentDaysPicker` 의 tempDays/applyChanges 사용.

> `editAnnualRate`/`handleRateInput` 는 편집 폼 state에 존재하지만, **현재 InfoSection에는 연이율 입력 필드가 노출되지 않는다**(월금액·기간·투자일만). 저장 시에는 기존 `item.annual_rate` 가 `initializeFromItem` 으로 채워진 `editAnnualRate` 가 그대로 전송된다.

### 6.3 저장 (`handleSave`, `useInvestmentDetailHandlers.ts:52-81`)

```
  monthlyAmountInWon = parseInt(editMonthlyAmount.replace(/,/g,'') || '0') * 10000
  parsedPeriod = parseInt(editPeriodYears || '0')
  annualRate = parseFloat(editAnnualRate || '0')
  isHabit = editIsHabitMode
  periodYearsToSave = isHabit ? null : parsedPeriod      // 적립형은 null

  검증:
    if (monthlyAmountInWon <= 0 || annualRate <= 0) → alert('모든 값을 올바르게 입력해주세요.'); return
    if (!isHabit && parsedPeriod <= 0) → alert('목표 기간을 입력하거나 "목표 기간 없이 적립하기"를 선택해주세요.'); return

  await handleUpdate({
    monthly_amount, period_years: periodYearsToSave, annual_rate,
    investment_days: editInvestmentDays.length > 0 ? editInvestmentDays : undefined,
  })
  setIsEditMode(false)
  catch → toastError(updateSaveFailed)
```

`handleUpdate` = `useInvestmentActions.handleUpdate` → `isUpdating` 토글 후 props.onUpdate 호출(`useInvestmentActions.ts:37-44`). 이 `onUpdate` 는 `page.tsx:94-95` 의 `updateInvestment(item.id, data)`.

#### records UPDATE 실제 DB 동작 (`useInvestmentsUpdate.ts`)

1. **낙관적 업데이트**: `setRecords(map r.id===id ? {...r,...data})`.
2. `validColumns` 화이트리스트로 필터(`title, symbol, monthly_amount, period_years, annual_rate, expected_amount, start_date, investment_days, is_custom_rate, notification_enabled, goal_id, record_type, interest_rate, maturity_date, unit_type, monthly_shares`).
3. `supabase.from('records').update(updateData).eq('id', id)` (반환 없이 — 406 회피).
4. `updateData.notification_enabled === false` 면 `scheduled_notifications` 의 `record_id=id & status='pending'` **삭제**. (true 전환 시 재예약은 Database Webhook `schedule-notification` 이 처리.)
5. 성공 후 `records` 단건 재조회 → state 갱신.
6. 실패 시 `setRecords(prevRecords)` 롤백 + throw.

### 6.4 취소

```
useInvestmentDetailHandlers.ts:84-86  handleCancel = () => setIsEditMode(false)
```

→ 로컬 편집 state는 폐기되고, 다음 편집 진입 시 `initializeFromItem` 으로 다시 채워진다(별도 reset 없음).

### 6.5 주수 모드 동기화 (`useShareModeSync.ts`)

상세 진입 시 1회(의존성 변화 시) 실행되는 부수효과(`InvestmentDetailView.tsx:100`):

```
useShareModeSync.ts:17-32
  if (!item.symbol) return
  fetchPriceWithFallback(item.symbol).then(price => {
    if (!price || price<=0 || unit_type!=='shares' || !monthly_shares || !user?.id) return
    syncSharesMonthlyAmount(supabase, user.id, item.id, monthly_shares, price)
  })
```

→ 종목(`symbol`) 보유 항목은 진입 때 시세를 갱신하고, **주수 모드면 `monthly_shares × 시세` 로 `monthly_amount` 를 DB에 재동기화**(stale 환산값으로 알림/카드/통계가 틀어지는 것 방지). 의존성: `symbol, unit_type, monthly_shares, item.id, user?.id`.

> 같은 동기화가 납입 ✓ 시점에도 일어난다: `capturePriceForPayment` 가 shares 모드에서 `syncSharesMonthlyAmount` 호출(`payment-capture.ts`).

---

## 7. 납입 기록

### 7.1 데이터 소스 (`usePaymentHistory.ts`) — Map 구조

`PaymentHistoryMap = Map<string, Set<string>>` = `recordId → Set<YYYY-MM-DD>` (`:11`).

fetch(`:20-52`): `payment_history` 에서 `record_id, payment_date, is_retroactive` 를 `user_id` 로 전부 조회한 뒤 **`is_retroactive` 로 두 Map 분리**:

```
usePaymentHistory.ts:36-46
  data.forEach(item => {
    const target = item.is_retroactive ? retroMap : autoMap
    if (!target.has(item.record_id)) target.set(item.record_id, new Set())
    target.get(item.record_id)?.add(item.payment_date)
  })
  setCompletedPayments(autoMap); setRetroactivePayments(retroMap)
```

→ `completedPayments`(자동) / `retroactivePayments`(소급) 두 맵. 한 번에 모든 record를 로드하므로 상세 화면은 `item.id` 키로 자기 것만 조회.

### 7.2 자동/소급 분리 가공 (`getPaymentHistoryFromStart`, `payment-history.ts:80-154`)

`useInvestmentData.ts:39-50` (투자) 와 `useSavingsCashDetail.ts:109-138` (예적금/현금) 가 동일 함수를 호출:

```
getPaymentHistoryFromStart(
  item.id, completedPayments,
  item.investment_days,
  item.start_date ?? item.created_at,   // 진행/표시 시작일
  item.period_years,
  item.created_at,                      // 자동 추적 시작일(소급 경계)
  retroactivePayments,
)
```

핵심 경계 로직:

```
payment-history.ts:91-122
  startDate = start_date ? new Date(start_date) : today
  endDate   = (startDate && period_years)
              ? new Date(startDate.getFullYear()+period_years, ...)   // 목표형 종료
              : today
  trackingStart = tracking_start_date ? new Date(...) : startDate
  effectiveTrackingStart = trackingStart < startDate ? startDate : trackingStart   // 엣지 보정
  trackingStartMonth = (effectiveTrackingStart 의 1일)
  ...
  isRetroactive = current < trackingStartMonth
```

- **start_date ~ created_at(트래킹 시작)** 사이의 월들은 `isRetroactive=true` (앱 등록 이전 = 소급).
- 소급 월의 완료 여부: `retroactivePayments` 에 `YYYY-MM-01` 이 있는지로 판단(`:125-129`). 없으면 false.
- 자동 월의 완료 여부(`:131-146`): 해당 월의 `investment_days` 중 `[startDate, endDate]` 범위 내 날짜를 모두 `completedPayments` 에서 찾으면 완료. **납입일이 그 달에 하나도 없으면(범위 밖이거나 미설정) `completed=true`** 처리(`paymentDatesInRange.length===0 → true`).
- 결과는 `results.reverse()` → **최신월이 맨 앞**(`:153`).

`isPaymentCompleted` (`payment-completion.ts:3-13`):

```
dateStr = `${year}-${MM}-${DD}`
return completedPayments.get(investmentId)?.has(dateStr) ?? false
```

분리:

```
useInvestmentData.ts:49-50
  autoPaymentHistory       = full.filter(e => !e.isRetroactive)
  retroactivePaymentHistory= full.filter(e => e.isRetroactive)
```

### 7.3 페이징 (`usePaymentPagination.ts`)

- 자동 기록에만 적용(소급은 전량 표시).
- `visiblePaymentMonths` 초기 **6**, `loadMore` 시 **+10** (`:7, :18`).
- `itemId` 변경 시 6으로 리셋(`:10-12`).
- `paymentHistory = full.slice(0, visible)`, `hasMorePaymentHistory = visible < full.length`.

### 7.4 렌더 (`PaymentHistorySection.tsx` + `PaymentHistoryTable.tsx`)

- 섹션 노출 조건: 자동 또는 소급 기록이 하나라도 있을 때(`InvestmentDetailContent.tsx:99-102`; SavingsCash는 `hasHistory`).
- **소급 블록**(`PaymentHistorySection.tsx:67-100`): "소급 기록 / 앱 등록 이전 기간" 헤더 + `PaymentHistoryTable variant="retroactive"` + 안내문 + (미기록 있으면) **"전체 완료 표시"** 버튼.
- **자동 블록**(`:102-129`): (소급 있을 때만 "자동 추적/앱 등록 이후" 라벨) + `variant="auto"` + `hasMorePaymentHistory` 시 "이어서 보기".
- `unrecordedRetroMonths` = `retro.filter(!completed).map(yearMonth)` (`:45-47`). `canBulkComplete` = 콜백 있고 미기록 1개 이상.

#### 테이블 (`PaymentHistoryTable.tsx`)

- 컬럼: 월 / 투자일 / 납입 금액 / 상태.
- 월 라벨(`renderMonthLabel :50-58`): 올해면 `M월`, 아니면 `YY.M월`.
- 투자일(`renderDateCell :38-48`): 소급은 `-`. 자동은 `investment_days` 각 날짜를 `formatSmartDate(new Date(y, m-1, d))` 로 표기(없으면 `-`).
- 납입 금액: `formatCurrency(item.monthly_amount)` (모든 행 동일 — 행별 캡처금액 표시 아님).
- 상태(`renderStatus :123-148`):
  - 소급+완료: `✓ 기록됨`
  - 소급+미완료: `canToggle` 면 `○ 탭하여 기록`, 아니면 `추적되지 않음`
  - 자동+완료: `✓ 완료됨`(초록), 자동+미완료: `✗ 미완료`(빨강)
- **소급 행만 탭 가능**(`canToggle = isRetro && !!onToggleRetroactive`, `:36`). 탭 시 `onToggleRetroactive(yearMonth, completed)`.

### 7.5 토글/일괄 완료 DB 동작

**소급 단건 토글** (`usePaymentHistory.ts:113-137`):

```
  date = `${yearMonth}-01`
  applyOptimistic(setRetroactivePayments, ...)          // 즉시 반영
  writePaymentHistoryRow({ paymentDate: date, isRetroactive:true, shouldDelete: currentCompleted })
  track('payment_uncheck'|'payment_complete', { month_offset, is_retroactive:true })
  실패 → toastError + fetchHistory() 재동기화
```

**자동 토글** (`togglePayment :74-105`, 상세화면에서 직접 호출되진 않지만 동일 맵 사용):

- 새 ✓ 시에만 `capturePriceForPayment` 로 시세 캡처(`captured_shares/price`), 취소는 행 DELETE.
- `writePaymentHistoryRow(... isRetroactive:false ...)`, 가격 캡처 실패 시 `priceCaptureFailed` 토스트.

**일괄 완료** (`markAllRetroactivePaid :143-166`):

```
  setRetroactivePayments( 각 ym에 `${ym}-01` 추가 )
  bulkUpsertRetroactiveRows({ yearMonths })            // ignoreDuplicates:true
  track('payment_complete_bulk', { count_bucket })
```

DB 헬퍼(`payment-history-db.ts`):

- `writePaymentHistoryRow`: `shouldDelete` 면 `delete().eq(user_id).eq(is_retroactive).match({record_id, payment_date})`; 아니면 `upsert({...}, { onConflict:'record_id, payment_date', ignoreDuplicates: isRetroactive })` — **소급은 중복 무시, 자동은 덮어쓰기**(`:43-54`).
- `bulkUpsertRetroactiveRows`: `payment_date='${ym}-01', is_retroactive:true` 행들을 `ignoreDuplicates:true` upsert(`:61-80`).

### 7.6 소급 온보딩 시트 (`useRetroactiveOnboarding.ts` + `RetroactiveOnboardingSheet.tsx`)

진입: `/investment?id=...&retroHint=1`. 이 URL은 **항목 등록 직후** `useAddInvestmentSubmit.ts:161` 에서 `router.push(`/investment?id=${inserted.id}&retroHint=1`)` 로 생성된다(과거 시작일로 등록 시).

```
useRetroactiveOnboarding.ts:22-27
  hasHint = searchParams.get('retroHint') === '1'
  hasRetro = (retroactivePaymentHistory?.length ?? 0) > 0
  isOpen = hasHint && hasRetro && !dismissed
```

- `consumeHintParam`(`:30-37`): `retroHint` 쿼리 제거 후 `router.replace` (back 시 재노출 방지).
- `onRecordNow`(`:39-43`): dismiss + `handleTabClick('history')`(납입기록 탭으로 스크롤) + hint 소비.
- `onLater`(`:45-48`): dismiss + hint 소비.
- 범위(`:50-59`): `retroactivePaymentHistory` 는 최신순이라 `[0]`=최신, `[length-1]`=가장 오래된 월. `rangeStart=oldest`, `rangeEnd=newest`, `monthsCount=length` (`-`→`.` 치환).
- hint 있는데 소급 없으면 URL만 정리(`:62-66`).

시트 UI(`RetroactiveOnboardingSheet.tsx`): 바텀시트, "앱 이전 기간이 있어요" + `{rangeStart} ~ {rangeEnd} ({monthsCount}개월)` + "지금 기록하기"/"나중에". `InvestmentDetailView.tsx:103-105, 182-189` 에서만 마운트(예적금/현금 경로엔 없음).

---

## 8. 알림 토글 (record별 `notification_enabled`)

> 투자 상세 헤더에만 존재. 예적금/현금 상세 헤더에는 알림 토글이 없다.

`useNotificationToggle(itemId)` (`useNotificationToggle.ts`):

- 마운트 시 `records.select('notification_enabled').eq('id', itemId).single()` → `notificationOn = data.notification_enabled ?? true` (`:13-33`).
- `toggleNotification`(`:35-67`):
  1. 낙관적 `setNotificationOn(next)`.
  2. `records.update({ notification_enabled: next }).eq('id', itemId).eq('user_id', user.id).select('id').single()`.
  3. 실패 → 롤백 + `toastError(notificationSettingsSaveFailed)`.
  4. **OFF 전환 시**: `scheduled_notifications.delete().eq('record_id', itemId).eq('status', 'pending')` (미발송 예약 취소).
  5. ON 전환 시 재예약은 records UPDATE 트리거인 **Database Webhook(`schedule-notification`)** 이 처리(`:66` 주석).

헤더 동작(`InvestmentDetailHeader.tsx`):

- 전역 알림 OFF면(`isGlobalNotificationOn=false` → `isNotificationDisabled=true`) 버튼 **비활성화**(`:36, :61-66`). 전역값은 `useGlobalNotification`(read-only, `InvestmentDetailView.tsx:57`)에서 가져온 `user_settings.notification_global_enabled`.
- 아이콘: ON `Bell`, OFF `BellSlash`(`:68-72`).
- 편집 모드에서는 알림/메뉴 영역 숨김(`isEditMode ? <div className="w-10"/>`, `:97-99`).

---

## 9. 삭제

### 9.1 확인 모달 (`DeleteConfirmModal.tsx`)

- 두 상세 화면 공통. 투자: `InvestmentDetailView.tsx:172-177`. 예적금/현금: `SavingsCashDetailView.tsx:188-194`(설명 문구 `"삭제된 적립 기록은 복구할 수 없습니다."`).
- 기본 제목 "정말 삭제하시겠습니까?", 기본 설명 "삭제된 투자 기록은 복구할 수 없습니다."(`:19-20`).
- 삭제 버튼(`:57-65`): 클릭 시 `track('investment_delete')` → `onConfirm()`. `isDeleting` 중 버튼/오버레이 비활성.

### 9.2 삭제 흐름

투자: 헤더 드롭다운 "삭제하기" → `setShowDeleteModal(true)`(`InvestmentDetailHeader.tsx:88-93`) → 모달 확인 → `handleDelete`(`useInvestmentActions.ts:46-55`: `isDeleting` 토글, 실패 시 `toastError(deleteFailed)`) → `page.tsx:97-100` `deleteInvestment(item.id)` 후 `router.replace('/')`.

예적금/현금: 드롭다운 → `detail.setShowDeleteModal(true)`(`SavingsCashDetailView.tsx:91-96`) → `detail.handleDelete`(`useSavingsCashDetail.ts:150-157`).

#### records DELETE 실제 DB 동작 (`useInvestmentsDelete.ts`)

1. 낙관적 `setRecords(filter r.id!==id)`.
2. `scheduled_notifications.delete().eq('record_id', id).eq('status', 'pending')` (실패해도 진행).
3. `records.delete().eq('id', id)`. 실패 → `setRecords(prevRecords)` 롤백 + throw.

> `payment_history` 행 정리는 이 클라이언트 코드에 없다 — DB 측 `ON DELETE CASCADE`/트리거 또는 별도 정리에 의존(코드 범위 밖).

### 9.3 만기 불일치 모달 (`MaturityMismatchConfirmModal.tsx`) — **이 화면에는 없음**

검증 결과 `MaturityMismatchConfirmModal` 은 `/investment?id=` 상세 플로우에서 **사용되지 않는다.** 실제 사용처는:

- `app/add/page.tsx`
- `app/goal/detail/edit/EditGoalClient.tsx`

용도: **목적(Goal)** 종료일이 묶인 적금 만기보다 빠를 때 폼 제출 직전 노출되는 안내 모달("묶인 적금이 더 늦게 만기돼요"). `onProceed`(그대로 진행) / `onAlignDate`(목적 종료일을 적금 만기로 조정) / `onCancel`. 설계 문서: `.omc/specs/deep-interview-goal-savings-mismatch.md`. → 투자 상세 문서 범위에서는 "관련 없음"으로 기록.

---

## 10. 상태별 UI / 엣지 케이스

| 상황 | 동작 | 코드 |
|---|---|---|
| `id` 쿼리 없음/공백 | 즉시 `router.replace('/')` + 스피너 | `page.tsx:25-33, 52-58` |
| 비로그인(`!user`) | `router.replace('/')` + 스피너 | `page.tsx:35-39, 60-66` |
| 데이터 로딩 중 | 스피너 | `page.tsx:68-74` |
| **삭제된/없는 id** (records 로드됐는데 미발견) | `router.replace('/')` | `page.tsx:41-45` |
| `getRecordType !== 'investment'` | 예적금/현금 전용 화면 | `page.tsx:77-88` |
| 적립형(`period_years` null/0) | 진행률 대신 streak+총납입액 | `ProgressSection.tsx:39-62` |
| 목표 기간 초과 | `completed=true` → "목표 달성! 🎉" + 초록 바 | `date.ts:149-153`, `Overview:62-66` |
| 납입 기록 0건(자동·소급 모두) | 납입기록 섹션·탭 미렌더(SavingsCash는 탭바도 숨김) | `InvestmentDetailContent.tsx:99-102`, `SavingsCashDetailView.tsx:62-63, 111` |
| 편집 중 종목명 | 수정 불가 안내 | `Overview:59-60` |
| 편집 저장 검증 실패 | `alert(...)` 후 중단 | `useInvestmentDetailHandlers.ts:61-68` |
| 편집 저장 실패(throw) | `toastError(updateSaveFailed)`, 편집 모드 유지 | `:78-80` |
| 알림 토글 실패 | 롤백 + 토스트 | `useNotificationToggle.ts:50-54` |
| 전역 알림 OFF | record 알림 버튼 비활성화 | `InvestmentDetailHeader.tsx:36, 61-66` |
| 소급 토글/일괄 실패 | 토스트 + `fetchHistory()` 재동기화 | `usePaymentHistory.ts:131-134, 160-163` |
| `retroHint=1` 인데 소급 없음 | 시트 미노출, URL만 정리 | `useRetroactiveOnboarding.ts:62-66` |
| `start_date > created_at` (엣지) | 트래킹 시작일을 start_date로 올림(소급 구간 없음) | `payment-history.ts:99-101` |
| 만기/이율 없는 예적금 | `maturity = null` → 만기 카드 미표시 | `savingsMaturity.ts:39-41` |
| 시세 fetch 실패(주수) | 동기화 skip, 화면 영향 없음 | `useShareModeSync.ts:20-31` |
| `goBack` (뒤로) | 동일 오리진 history 있으면 back, 없으면 `/` | `useFlowBack.ts:24-44` |

---

## 11. 분석 이벤트 (`track`)

`track(event, params)` (`app/lib/analytics.ts:27-37`)는 GA4로 전송하며 모든 이벤트에 `platform`(`web`/`ios`/`android`)이 자동 포함. 헬퍼: `monthOffset(YYYY-MM-DD)`=당월기준 상대월(`:80-86`), `countBucket(n)`=`1_3`/`4_6`/`7_12`/`>=13`(`:120-125`).

이 화면(및 직접 호출 훅)에서 발생하는 이벤트:

| 이벤트 | 파라미터 | 발생 위치 |
|---|---|---|
| `investment_delete` | (없음) | 삭제 모달 확인 버튼 `DeleteConfirmModal.tsx:59` |
| `payment_complete` | `month_offset`, `is_retroactive` | 자동/소급 납입 ✓ `usePaymentHistory.ts:99, 129` |
| `payment_uncheck` | `month_offset`, `is_retroactive` | 자동/소급 납입 취소 `usePaymentHistory.ts:97, 127` |
| `payment_complete_bulk` | `count_bucket` | 소급 일괄 완료 `usePaymentHistory.ts:159` |

> 상세 화면 자체에는 "조회(view)" 이벤트나 편집 저장(`update`) 이벤트가 없다. 편집·알림 토글·탭 전환은 트래킹되지 않는다.

---

## 12. 관련 DB 테이블·컬럼

### `records` (= 적립 항목, 스키마가 곧 API)

상세/편집에서 읽고 쓰는 컬럼(`app/types/investment.ts:19-53`, UPDATE 화이트리스트 `useInvestmentsUpdate.ts`):

| 컬럼 | 타입 | 용도 |
|---|---|---|
| `id` | uuid | 식별자(`?id=`) |
| `title` | text | 제목(편집 불가) |
| `symbol` | text? | 종목 코드 → 시세 동기화 |
| `monthly_amount` | int(원) | 월 납입금. 주수 모드는 환산 동기화 |
| `period_years` | int? null | 목표 기간(년). null/0 = 적립형 |
| `annual_rate` | numeric | 기대 연수익률(%) |
| `start_date` | date? | 시작일(없으면 `created_at`) |
| `created_at` | timestamptz | 자동추적 시작 = 소급 경계 |
| `investment_days` | int[]? | 매월 납입일 |
| `is_custom_rate` | bool? | 수익률 직접입력 여부 |
| `notification_enabled` | bool? | record별 알림 on/off |
| `goal_id` | uuid? | 묶인 목적 |
| `record_type` | enum | `investment`/`savings`/`cash` (분기) |
| `interest_rate` | numeric? | 예적금 약정 연이율(%) |
| `maturity_date` | date? | 예적금 만기일(= 종료일) |
| `unit_type` | enum | `amount`/`shares` |
| `monthly_shares` | int? | 주수 모드 월 매수 주수 |
| `settled_at` | timestamptz? | 만기 정산 시각(상세에선 미사용) |

### `payment_history` (납입 기록)

조회·기록 컬럼(`usePaymentHistory.ts`, `payment-history-db.ts`):

| 컬럼 | 용도 |
|---|---|
| `user_id` | 소유자 |
| `record_id` | 대상 항목 |
| `payment_date` | 자동=`YYYY-MM-DD`, 소급=`YYYY-MM-01` |
| `is_retroactive` | true=소급(앱 등록 이전), false=자동 |
| `captured_shares` | 매수 시점 캡처 주수(자동만, 소급 NULL) |
| `captured_price` | 매수 시점 1주 시세(원, 실패 시 NULL) |

- upsert onConflict: `'record_id, payment_date'`. 소급은 `ignoreDuplicates:true`, 자동은 덮어쓰기.

### `scheduled_notifications`

- 알림 OFF/record 삭제/UPDATE(notification_enabled=false) 시 `record_id` + `status='pending'` 행 DELETE (`useNotificationToggle.ts:57-65`, `useInvestmentsUpdate.ts`, `useInvestmentsDelete.ts`).

### `user_settings`

- `notification_global_enabled` — 전역 알림(읽기 전용으로 record 토글 활성화 판단, `useGlobalNotification.ts`).

---

## 13. 파일 경로 인덱스

### 진입/뷰
- 진입 라우트: `app/investment/page.tsx:14-117` (가드 `:25-45`, 분기 `:77-101`)
- 투자 상세 뷰: `app/components/InvestmentDetailView.tsx:28-201` (Provider 래핑 `:195-201`)
- 예적금/현금 뷰: `app/components/SavingsCashDetailView.tsx:37-197`

### 섹션 컴포넌트
- 콘텐츠/탭바: `app/components/InvestmentDetailSections/InvestmentDetailContent.tsx:17-127`
- 상세 Context: `app/components/InvestmentDetailSections/InvestmentDetailContext.tsx:1-48`
- 헤더(알림·메뉴): `app/components/InvestmentDetailSections/InvestmentDetailHeader.tsx:25-102`
- 개요/제목: `app/components/InvestmentDetailSections/InvestmentDetailOverview.tsx:28-87`
- 진행률/streak: `app/components/InvestmentDetailSections/ProgressSection.tsx:18-86`
- 투자정보/편집폼: `app/components/InvestmentDetailSections/InfoSection.tsx:16-113`
- 투자일 필드: `app/components/InvestmentDetailSections/InvestmentDaysField.tsx:13-61`
- 편집 액션바: `app/components/InvestmentDetailSections/InvestmentDetailActions.tsx:9-36`
- 납입기록 섹션: `app/components/InvestmentDetailSections/PaymentHistorySection.tsx:13-140`
- 납입기록 테이블: `app/components/InvestmentDetailSections/PaymentHistoryTable.tsx:29-148` (상태 `:123-148`)
- 소급 일괄 모달: `app/components/InvestmentDetailSections/BulkCompleteRetroactiveModal.tsx:11-59`
- 소급 온보딩 시트: `app/components/InvestmentDetailSections/RetroactiveOnboardingSheet.tsx:18-88`
- 섹션 props 타입: `app/components/InvestmentDetailSections/types.ts:1-48`
- 예적금/현금 정보: `app/components/SavingsCashDetailSections/SavingsCashInfoSection.tsx:48-116` (만기 카드 `:92-112`)
- 공통 필드: `app/components/Common/InvestmentField.tsx:21-90`
- 삭제 모달: `app/components/Common/DeleteConfirmModal.tsx:14-71` (track `:59`)
- 만기 불일치 모달(타 플로우): `app/components/Common/MaturityMismatchConfirmModal.tsx:32-108`
- View 섹션(레거시): `app/components/InvestmentViewSections/InvestmentViewHeader.tsx`, `InvestmentViewOverview.tsx`
- Edit 섹션(/add 등 재사용): `app/components/InvestmentEditSections/InvestmentEditView.tsx:18-84`, `InvestmentEditSheet.tsx`(연이율 추천칩)

### 훅 — 상세
- UI 상태: `app/hooks/investment/detail/useInvestmentDetailUI.ts:5-18`
- 핸들러(저장/취소/삭제): `app/hooks/investment/detail/useInvestmentDetailHandlers.ts:23-109` (handleSave `:52-81`)
- 편집 폼 상태: `app/hooks/investment/detail/useInvestmentDetailEdit.ts:33-85` (initializeFromItem `:54-62`)
- 데이터 집계: `app/hooks/investment/data/useInvestmentData.ts:10-78`
- 탭(레거시): `app/hooks/investment/detail/useInvestmentTabs.ts:5-44`
- 주수 동기화: `app/hooks/investment/detail/useShareModeSync.ts:14-33`
- 소급 온보딩: `app/hooks/investment/detail/useRetroactiveOnboarding.ts:15-76`
- 예적금/현금 상세: `app/hooks/investment/detail/useSavingsCashDetail.ts:61-179` (진행률 `:99-106`, 원금 `:80-84`)

### 훅 — 계산/액션/데이터
- 투자 계산: `app/hooks/investment/calculations/useInvestmentCalculations.ts:20-83` (원금 `:57`, 진행률 `:59-64`)
- API 액션: `app/hooks/ui/useInvestmentActions.ts:28-63`
- records 전역: `app/hooks/investment/data/useInvestments.ts:10-36`
- records UPDATE: `app/hooks/investment/data/useInvestmentsUpdate.ts` (화이트리스트/알림취소 포함)
- records DELETE: `app/hooks/investment/data/useInvestmentsDelete.ts`
- 컨텍스트: `app/contexts/InvestmentTabContext.tsx:25-83`, `app/contexts/InvestmentsContext.tsx:14-32`

### 훅 — 납입/알림
- 납입 맵/토글: `app/hooks/payment/usePaymentHistory.ts:13-177` (fetch 분리 `:36-46`, 소급토글 `:113-137`, 일괄 `:143-166`)
- 페이징: `app/hooks/payment/usePaymentPagination.ts:3-26`
- 이번달 상태(타 화면): `app/hooks/payment/useMonthlyPaymentStatus.ts:33-74`
- 완료 토글+도토리(타 화면): `app/hooks/payment/usePaymentCompletion.ts`
- record 알림 토글: `app/hooks/notification/useNotificationToggle.ts:8-70`
- 전역 알림(read): `app/hooks/notification/useGlobalNotification.ts`
- 스티키 헤더: `app/hooks/ui/useScrollHeader.ts:3-34`
- 뒤로가기: `app/hooks/navigation/useFlowBack.ts:21-48`

### 유틸
- 날짜/진행률: `app/utils/date.ts` (calculateEndDate `:32-35`, getElapsedMonths `:50-53`, calculateProgress `:61-70`, isCompleted `:149-153`, getNextPaymentDate `:264-278`, formatDuration `:8-26`, formatSmartDate `:134-143`)
- 예적금 만기 단리: `app/utils/savingsMaturity.ts:33-67` (공식 `:54-66`)
- 납입기록 가공: `app/utils/payment-history.ts:80-154` (소급 경계 `:99-122`)
- 완료 판정: `app/utils/payment-completion.ts:3-13`
- 납입 DB 헬퍼: `app/utils/payment-history-db.ts:8-80`
- 시세 캡처: `app/utils/payment-capture.ts`
- 표기 헬퍼: `app/utils/investment-display.ts` (formatContributionLabel/Value)
- 타입/헬퍼: `app/types/investment.ts` (getRecordType `:59-61`, isHabitMode `:74-76`, getStartDate `:112-117`, formatInvestmentDays `:82-91`)
- 레이아웃 상수: `app/constants/layout-constants.ts` (APP_HEADER_TOTAL_HEIGHT)
- 분석: `app/lib/analytics.ts` (track `:27-37`, monthOffset `:80-86`, countBucket `:120-125`)

### 온보딩 진입(이 화면 밖, 참고)
- `retroHint=1` 생성: `app/hooks/investment/add/useAddInvestmentSubmit.ts:161`
