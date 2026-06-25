# 캘린더(/calendar) & 다가오는 투자(Upcoming) 기능 분석

> 실제 구현 코드를 한 줄씩 읽어 정리한 문서. 모든 로직은 인용이며, 줄 번호는 작성 시점(`develop/hansol`) 기준이다.
> 핵심 데이터 단위는 `payment_history` 테이블 1행 = "특정 투자(record)의 특정 날짜 1회 납입 완료"이며, 캘린더 화면과 홈의 "이번 달 체크리스트"(Upcoming)는 **같은 `usePaymentHistory` 상태와 같은 `togglePayment`** 를 공유한다.

---

## 1. 기능 개요

### 1-1. 캘린더(`/calendar`)
- 월 단위 그리드로 사용자의 **진행 중인 투자(active records)** 의 납입 일정을 보여주는 전용 탭 화면.
- 각 날짜 셀 하단에 작은 점(dot)으로 **완료(green) / 미완료(red) / 예정(grey)** 상태를 표시.
- 그리드 아래에는 1일~말일까지 모든 날짜의 **아젠다 리스트**가 있고, 각 행에서 바로 "완료하기" 체크가 가능.
- 완료 시 토스트로 **토리(도토리) +10** 보상을 알리고, 5초 동안 "되돌리기" Undo 토스트를 띄운다.

### 1-2. 다가오는 투자 / "이번 달 체크리스트"(Upcoming)
- 홈 대시보드에 박히는 카드 컴포넌트. UI상 제목은 **"이번 달 체크리스트"** 이나, 훅/컴포넌트 네이밍은 모두 `Upcoming*` 이다.
- 오늘부터 선택한 기간(오늘/3일/7일/보름/한달/1년, 또는 커스텀 날짜 범위) 안에 도래하는 **미완료 납입 건만** 추려서 보여준다.
- 기본 5건만 노출, "N건 더 보기 / 접기" 토글.
- 캘린더와 동일하게 행에서 "완료하기" → 토리 +10 → 5초 Undo.

### 1-3. 공통 데이터 흐름
```
records (InvestmentsContext)                 payment_history (Supabase)
        │                                            │
        ▼                                            ▼
getPaymentEventsForMonth / getUpcomingPayments   usePaymentHistory → completedPayments: Map<recordId, Set<YYYY-MM-DD>>
        │                                            │
        └──────────────┬─────────────────────────────┘
                       ▼
       isPaymentCompleted(map, id, y, m, d)  → 완료 여부 판정
                       ▼
   getDayStatus / visibleItems / MonthAgenda 렌더
                       │
   "완료하기" 클릭 → togglePayment → 낙관적 update + 시세 캡처 + DB upsert + 토리 +10
```

---

## 2. 캘린더 화면 구성

화면 합성은 `app/calendar/page.tsx`(컨테이너) → `app/components/CalendarView.tsx`(레이아웃) → `CalendarSections/*`(세부 섹션) 구조다.

`page.tsx`는 데이터/상태 훅만 호출하고 모든 props를 `CalendarView`로 내려보낸다 (`app/calendar/page.tsx:17-100`). 미인증 시 `/login`으로 `router.replace` (`:66-69`).

`CalendarView`(`app/components/CalendarView.tsx`)는 `fixed inset-0` 전체화면 레이아웃이다. 상단 고정 헤더 + 고정 캘린더 그리드 + 그 아래 **내부 스크롤되는 아젠다 영역** 으로 구성된다 (`:117-181`). 네이티브 앱일 때 노치 대응 `headerSafeTop`/`contentPaddingTop`을 계산한다 (`:105-108`). 로딩 중에는 스피너만 (`:109-115`).

### 2-1. 월 네비게이션 — `CalendarHeaderSection`
파일: `app/components/CalendarSections/CalendarHeaderSection.tsx`
- 상단 고정 앱바(`fixed inset-x-0 top-0 z-30`). 좌/우 캐럿(`CaretLeft`/`CaretRight`)으로 `goToPrevMonth`/`goToNextMonth` (`:30-61`).
- 가운데 라벨은 버튼이며 탭 시 `openPicker()`로 연도·월 피커를 연다 (`:39-52`).
- 라벨 포맷: 올해면 `'M월'`, 다른 해면 `'yyyy년 M월'` (`:45-51`).
- 추가로 `CalendarView`는 그리드 전체에 좌우 스와이프를 걸어 월 이동을 보조 제공한다 (`useSwipe({ onSwipeLeft: goToNextMonth, onSwipeRight: goToPrevMonth })`, `CalendarView.tsx:90-93`).

### 2-2. 날짜 셀 — `CalendarGridSection`
파일: `app/components/CalendarSections/CalendarGridSection.tsx`
- `calendarDays`(앞쪽 null 패딩 포함, §3 useCalendar 참조)를 7개씩 잘라 주(week) 배열로 변환 (`chunkWeeks`, `:23-27`).
- 요일 헤더 `['일','월','화','수','목','금','토']` (`:81-85`).
- 각 셀:
  - `null`(패딩) 셀 → 클릭 시 `clearSelection` 하는 빈 버튼 (`:101-112`).
  - 날짜 셀 → `getDayStatus(day)`로 상태를 받아 점 색을 정함. 선택일/오늘 여부에 따라 배경·링·폰트가 달라진다 (`:114-156`).
- 상태 점(dot): `completed → bg-green-500`, `missed → bg-red-500`, `scheduled → bg-surface-strong-hover`(회색). `status`가 `null`이면 점 없음 (`:141-153`).
- `isSelected` 판정: `selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth()` (`:115-117`).
- `isToday`: 표시 중인 달이 이번 달일 때만 `today.getDate()` 와 비교 (`:68-72`, `:118`).
- 카드 하단에는 범례(완료됨/미완료/예정)가 있고, 표시 중인 달이 이번 달이 아니면(`!isCurrentMonth`) 우측에 "오늘"(`ArrowUUpLeft`) 단축 버튼이 등장 → `goToToday()` (`:169-196`).

### 2-3. 선택일 패널 / 아젠다 — `MonthAgendaSection`
파일: `app/components/CalendarSections/MonthAgendaSection.tsx`
- 별도의 "선택일만 보여주는 패널"이 아니라, **한 달 1일~말일 전체를 날짜 그룹으로 나열** 하고 선택일로 스크롤하는 방식이다.
- `buildMonthDayGroups(eventsForMonth, year, month)`로 1일~말일까지 모든 날짜 그룹을 생성. 이벤트 없는 날도 `events.length === 0` 빈 그룹으로 포함되어 항상 자리가 존재한다 (`:42-45`, `calendar-agenda.ts:14-35`).
- 각 그룹 헤더(`<h4>`)는 `sticky top-0`. 라벨은 `formatGroupLabel` (오늘이면 `오늘 · M월 d일 (E)`) (`:97-107`, `calendar-agenda.ts:37-40`).
  - 빈 날: `· 예정 없음` 회색 표기 (`:103`).
  - 과거(`date < today`)이고 미완료가 남은 날: `· 미완료 {pendingCount}` 빨강 표기 (`:104-106`). `pendingCount = events.filter(e => !isEventCompleted(e)).length` (`:86`).
- 선택일 강조: `selectedDayKey`(선택일이 현재 보이는 월에 속할 때만 그 날짜) 와 같은 그룹 헤더는 `font-semibold text-brand-600` (`:48-53`, `:87`, `:99`).
- 각 이벤트 행은 `PaymentEventRow` (§2-5). 행 클릭 시 `router.push('/investment?id=${investmentId}')` 로 상세 이동 (`:76-78`, `:115`). (정적 export 정책상 query param 방식.)
- **스크롤 동기화**: `scrollTick`이 바뀔 때만 실제 스크롤. `selectedDate` 변경 단독으로는 스크롤하지 않도록 `selectedDateRef`로 최신값만 노출(피드백 루프 방지) (`:55-74`).
  - 선택일이 없으면 리스트 최상단으로 smooth scroll (`:66-68`).
  - 선택일이 현재 월에 속하면 해당 그룹 엘리먼트로 `scrollIntoView({ block: 'start' })` (`:70-73`).
  - 스크롤 컨테이너는 `closest('[data-calendar-scroll]')`로 찾는다 (`CalendarView.tsx:158`).

### 2-4. 접기/펼치기 — `useCalendarCollapse` + 그리드 max-height 트랜지션
파일: `app/hooks/calendar/useCalendarCollapse.ts` (판정), `CalendarGridSection.tsx` (시각 표현)
- 아젠다 리스트를 스크롤하면 캘린더 그리드가 **포커스된 주(week) 한 줄만 남기고 접힌다(주 보기)**. 최상단으로 복귀하면 다시 월 보기로 펼쳐진다 (`CalendarView.tsx:95-103`).
- 접힘 상태 `isCollapsed`는 스크롤/터치 제스처로 결정 (`useCalendarCollapse`):
  - 스크롤 임계값: 접기 `top > COLLAPSE_THRESHOLD(24)` 또는 빠른 아래 제스처(`velocity > 0.5 && top > 6`); 펼치기 `top < EXPAND_THRESHOLD(6)` 또는 빠른 위 제스처 (`:43-73`).
  - 최상단에서 아래로 당기는 터치로도 펼침(`PULL_EXPAND_THRESHOLD(30)` / fast `10`) (`:82-110`).
  - 토글 후 250ms 락(`TOGGLE_LOCK_MS`)으로 피드백 루프 방지 (`:33-36`, `:13-14`).
  - **자동 스크롤 락**: 날짜 선택으로 인한 자동 smooth scroll(약 400~700ms) 동안 collapse 판정을 무시하려고 `selectedDate` 변경 시 800ms 락(`AUTO_SCROLL_LOCK_MS`). 단 최초 마운트(today 초기화)는 `didMountRef`로 스킵 (`:122-132`).
- 시각 표현(`CalendarGridSection`):
  - 포커스 주 인덱스 `getFocusedWeekIndex`: 선택일(없으면 오늘)이 현재 월에 있을 때 그 날짜가 포함된 주, 아니면 0번 주 (`:29-42`).
  - 접힘 시 포커스 주 외 모든 주 행을 `max-h-0 opacity-0 pointer-events-none`로 숨김, 펼침 시 `max-h-20` (`:88-99`).
  - 범례 영역도 접힘 시 `max-h-0`로 숨기고, 대신 카드 하단에 펼침 토글(`CaretDown`)이 등장 → `toggleCollapsed()` (`:161-213`).
- 트랜지션: `transition-[max-height,opacity,margin-top] duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]`, `motion-reduce:transition-none` (`:94`, `:162`, `:199`).

### 2-5. 이벤트 행 — `PaymentEventRow`
파일: `app/components/CalendarSections/PaymentEventRow.tsx`
- 좌측: 아바타(`getInvestmentAvatarLabel(event.title)`) + 종목명 + 월 납입액(`formatMonthlyContribution(investment).main`) (`:25`, `:44-67`).
- 아바타 색: 완료 시 회색, 미완료 시 미국장(`market === 'US'`)이면 파랑(`bg-blue-100`), 그 외 브랜드 색 (`:46-52`).
- 우측: 완료 시 `✓ 완료됨` 텍스트, 미완료 시 `완료하기` 버튼(`onComplete`, `stopPropagation`으로 행 클릭과 분리) (`:69-85`).

### 2-6. 연도·월 피커 — `MonthPickerSheet`
파일: `app/components/CalendarSections/MonthPickerSheet.tsx`
- 바텀 시트(`useDismissibleSheet`로 슬라이드업/다운, `APP_BOTTOM_NAV_TOTAL_HEIGHT`만큼 하단 패딩) (`:46-64`).
- 연도 스테퍼(`useMonthPicker`) + 좌우 스와이프(`useSwipe`)로 연도 페이징 (`:24-44`, `:84-106`).
- 3×4 월 그리드. 현재 보고 있는 월(`isViewing`)은 브랜드 강조 + scale-110, 오늘이 속한 월(`isThisMonth`)은 약한 강조 (`:113-144`).
- 월 선택 시 `onSelect(viewYear, m)`(=`goToMonth`) 호출 후 `requestClose()` (`:121-124`).

---

## 3. 일별 상태 판정 — `getDayStatus`

위치: `app/hooks/calendar/useCalendarEvents.ts:55-66` (페이지에서 이 훅의 `getDayStatus`를 사용).

```ts
const getDayStatus = (day: number): 'completed' | 'missed' | 'scheduled' | null => {
  const events = eventsByDay.get(day) || []
  if (events.length === 0) return null
  const today = new Date()
  const isPast = year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth() + 1) ||
    (year === today.getFullYear() && month === today.getMonth() + 1 && day < today.getDate())
  const allCompleted = events.every((ev) => isEventCompleted(ev))
  if (allCompleted) return 'completed'
  if (isPast) return 'missed'
  return 'scheduled'
}
```

판정 규칙(우선순위 순):
1. 해당 날짜에 납입 이벤트가 없음 → **`null`** (점 미표시).
2. 그 날의 **모든** 이벤트가 완료 → **`completed`**(green). (오늘/미래여도 모두 완료면 completed가 우선.)
3. 미완료가 있고 그 날이 **과거(오늘 이전)** → **`missed`**(red).
4. 미완료가 있고 **오늘 또는 미래** → **`scheduled`**(grey).

보조 데이터:
- `eventsByDay`: `eventsForMonth`를 `day → PaymentEvent[]`로 묶은 Map (`:44-52`).
- `isEventCompleted`: `usePaymentCompletion`에서 내려온 콜백으로, `isPaymentCompleted(completedPayments, id, y, m, d)` 결과 (`usePaymentCompletion.ts:27-29`).
- `isPast`는 연/월/일을 직접 비교한다. (`new Date()`를 매 호출 평가하므로 자정 경과 후에도 today가 갱신된다.)

> 주의: `getDayStatus`는 `completedPayments`(auto)만 본다. 소급(`retroactivePayments`)은 캘린더 점 색에 반영되지 않는다.

---

## 4. 월별 납입 이벤트 생성 — `getPaymentEventsForMonth`

위치: `app/utils/stats.ts:19-71`.

```ts
for (const inv of investments) {
  const startDate = inv.start_date ? new Date(inv.start_date) : new Date(inv.created_at)
  // 적립형(period_years null/0)은 만료 없음 → endDate = null
  const endDate = inv.period_years && inv.period_years > 0
    ? (() => { const d = new Date(startDate); d.setFullYear(d.getFullYear() + inv.period_years!); return d })()
    : null

  const days = inv.investment_days
  if (!days || days.length === 0) continue

  const daysInMonth = new Date(year, month, 0).getDate()
  for (const day of days) {
    if (day > daysInMonth) continue            // 그 달에 없는 날(2/30 등) 스킵
    const paymentDate = new Date(year, month - 1, day)
    if (paymentDate < startDate) continue       // 시작 전 스킵
    if (endDate && paymentDate > endDate) continue  // 만기 후 스킵
    events.push({ investmentId, year, month, day, yearMonth, monthlyAmount, title, unitType, monthlyShares })
  }
}
return events.sort((a, b) => a.day - b.day)
```

핵심 로직:
- **시작일**: `start_date`가 있으면 그 값, 없으면 `created_at` (`:38`).
- **만기일**: `period_years > 0`이면 `startDate + period_years년`, 적립형(`null/0`)이면 만료 없음(`null`) (`:40-46`).
- **반복일(investment_days)**: 투자별 "매월 며칠"을 담은 배열(예: `[5, 25]`). 비어 있으면 그 투자는 이벤트 0개 (`:48-49`).
- **해당 월의 실제 일수**: `new Date(year, month, 0).getDate()` (month는 1-based, day=0 → 전달 말일 = 그 달 말일). `day`가 이 값을 넘으면(예: 2월의 30일) 스킵 (`:51-53`).
- **범위 필터**: `paymentDate`가 시작일 이전이거나 만기일 이후면 제외 (`:55-56`).
- 결과는 `day` 오름차순 정렬 (`:70`).
- `PaymentEvent` 필드: `investmentId, year, month, day, yearMonth('YYYY-MM'), monthlyAmount, title, unitType?, monthlyShares?` (`:4-14`).

`useCalendarEvents`는 이 함수를 **활성 투자만** 으로 호출한다:
- `activeRecords` = `records.filter(r => !isCompleted(getStartDate(r), r.period_years))` 후 `created_at` 내림차순 정렬 (`useCalendarEvents.ts:23-35`).
- `isCompleted`(`utils/date.ts:149-153`)는 목표형에서 `endDate < 오늘`이면 true, 적립형은 항상 false → **만기 지난 목표형 투자는 캘린더에서 제외**.

> `stats.ts`에는 같은 이벤트 파이프라인을 재사용하는 통계 함수가 많다: `getThisMonthStats`(`:76`), `getPeriodTotalPaid`(`:112`), `getMonthlyCompletionRates`(`:147`), `getMonthlyCompletionRatesForRange`(`:192`), `getMonthlyPaymentDelta`(`:246`, auto는 event-based + retro는 `YYYY-MM-` prefix-count), `getPeriodTotalPaidForRange`(`:321`). 이들은 캘린더 화면이 아닌 통계/홈에서 쓰인다.

---

## 5. 납입 완료 처리 — `usePaymentCompletion` & `usePaymentHistory`

### 5-1. `usePaymentCompletion` (캘린더 화면용)
위치: `app/hooks/payment/usePaymentCompletion.ts`
- `usePaymentHistory()`에서 `completedPayments`/`togglePayment`를 받아 사용 (`:13`).
- `isEventCompleted(e)` = `isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)` (`:27-29`).
- `handleComplete(e)` (`:31-47`):
  1. `dateStr = 'YYYY-MM-DD'` 생성.
  2. `await togglePayment(e.investmentId, dateStr, false)` — 현재 미완료(false)를 완료로 토글.
  3. `awardToryInvestmentComplete({ paymentDateYMD: dateStr, amount: 10 })` 호출, `reward.awarded`면 `toastSuccess('🌰 +10 도토리')`.
  4. `setPendingUndo(e)` 후 5초(`TOAST_DURATION_MS = 5000`) 타이머로 자동 해제. 새 완료가 들어오면 이전 타이머 클리어 (`:42-46`).
- `handleUndo()` (`:49-64`): `pendingUndoRef.current`의 이벤트로 `togglePayment(id, dateStr, true)`(완료→미완료 = DB DELETE), `pendingUndo` 해제, 타이머 클리어.
- 언마운트 시 타이머 클린업 (`:21-25`).

> 주의: Undo는 **payment_history 행만 삭제**한다. `awardToryInvestmentComplete`로 적립한 토리 +10은 되돌리지 않는다(보상 차감 로직 없음).

### 5-2. `usePaymentHistory` — 상태/낙관적 업데이트/시세 캡처
위치: `app/hooks/payment/usePaymentHistory.ts`
- 상태: `completedPayments`(auto), `retroactivePayments`(소급), `isLoading`. 둘 다 `Map<recordId, Set<YYYY-MM-DD>>` (`:11`, `:16-18`).
- `fetchHistory`: `payment_history`에서 `record_id, payment_date, is_retroactive`를 `user_id`로 조회 → `is_retroactive`로 auto/retro 맵 분리 (`:20-52`). 실패 시 `toastError(paymentHistoryLoadFailed)`.
- **낙관적 업데이트** `applyOptimistic`: 토글 즉시 메모리 Map을 갱신(완료면 add, 취소면 delete). 새 Map/Set 복제 (`:58-72`).
- **`togglePayment(recordId, date, currentCompleted)`** (`:74-105`) — 캘린더·Upcoming·홈 체크리스트가 모두 쓰는 단일 진입점:
  1. `applyOptimistic(setCompletedPayments, ...)` 먼저 호출(즉시 UI 반영).
  2. **시세 캡처**: 새 완료(`currentCompleted === false`)일 때만 `capturePriceForPayment(supabase, user.id, recordId)`. 취소(`true`)는 행 DELETE라 캡처 안 함 → `{ capturedShares: null, capturedPrice: null, priceFailed: false }` (`:78-81`).
  3. `writePaymentHistoryRow(...)`로 upsert/delete (`shouldDelete = currentCompleted`, `isRetroactive: false`) (`:83-92`).
  4. `captured.priceFailed`면 `toastError(priceCaptureFailed)` (`:93-95`).
  5. 분석: 취소면 `track('payment_uncheck', { month_offset, is_retroactive: false })`, 완료면 `track('payment_complete', ...)` (`:96-100`).
  6. 실패 시 `toastError(paymentToggleFailed)` + `fetchHistory()`로 서버 상태 재동기화(낙관적 롤백) (`:101-104`).
- 소급 토글 `toggleRetroactivePayment(recordId, yearMonth, currentCompleted)`: `date = '${yearMonth}-01'`, `isRetroactive: true`로 같은 패턴 (`:113-137`). 캘린더 화면에서는 직접 쓰지 않음(투자 상세 화면용).
- `markAllRetroactivePaid`: 여러 월 일괄 upsert(`bulkUpsertRetroactiveRows`, `ignoreDuplicates`), `track('payment_complete_bulk', { count_bucket })` (`:143-166`).

### 5-3. 시세 캡처 — `capturePriceForPayment`
위치: `app/utils/payment-capture.ts`
- `records`에서 `symbol, monthly_amount, unit_type, monthly_shares`를 조회 (`:33-38`). symbol 없거나 에러면 빈 캡처(`EMPTY_CAPTURE`).
- `capturedPrice = fetchPriceWithFallback(symbol)` (`:44`).
- 모드 분기 (`:46-55`):
  - `unit_type === 'shares'`: `capturedShares = monthly_shares`. 가격이 유효하면 `syncSharesMonthlyAmount`로 `monthly_amount`도 동기화(통계/알림 stale 방지).
  - amount 모드: 가격>0이면 `capturedShares = monthly_amount / capturedPrice`.
- 반환 `{ capturedShares, capturedPrice, priceFailed: capturedPrice === null }`. 예외 시 `priceFailed: true` (`:57-64`).

### 5-4. DB 쓰기 — `writePaymentHistoryRow`
위치: `app/utils/payment-history-db.ts`
- `shouldDelete`면 `delete().match({ record_id, payment_date })` + `eq(user_id)`,`eq(is_retroactive)` (`:32-41`).
- 아니면 `upsert({ user_id, record_id, payment_date, is_retroactive, captured_shares, captured_price }, { onConflict: 'record_id, payment_date', ignoreDuplicates: isRetroactive })` (`:43-54`). 자동(auto)은 `ignoreDuplicates: false`라 같은 키 재완료 시 갱신, 소급은 `true`라 기존 유지.

### 5-5. 토리 보상 — `awardToryInvestmentComplete`
위치: `app/utils/tory-raising/awardToryInvestmentComplete.ts`
- localStorage `'tory-state'` 기반(서버 아님). `amount` 기본 10 (`:108-109`).
- **하루 1회 멱등(idempotent)**: `lastInvestmentCompleteDate === paymentDateYMD`면 적립하지 않고 `{ awarded: false, amount: 0, ... }` 반환 (`:115-124`).
  - 즉, **같은 납입일(YMD)에 대해서는 하루에 한 번만 +10** 지급. 같은 날 여러 종목을 완료해도 `paymentDateYMD`가 같으면 첫 건만 적립된다(중복 보상 차단).
- 적립 시: `totalAcorns += amount`, `balance += amount`, `lastInvestmentCompleteDate = paymentDateYMD`, `recentEarnings`에 `{ type: 'investment', amount, at }` prepend(최대 12개) (`:126-142`).
- 반환에 `levelBefore/levelAfter/titleAfter`(레벨/칭호) 포함 (`calculateToryLevel`/`getTitleForLevel`).
- `ymdNow`는 `toLocaleDateString('sv-SE')`(로컬 타임존 기준 YYYY-MM-DD) 사용 (`:78-80`).

---

## 6. 다가오는 투자(Upcoming)

### 6-1. 추출 로직 — `getUpcomingPayments` / `getUpcomingPaymentsInRange`
위치: `app/utils/date.ts:190-257`
- `getUpcomingPayments(items, withinDays=7)` (`:190-216`):
  - `today = startOfToday()`(자정). `daysToCheck = max(0, withinDays)`.
  - 각 투자의 `investment_days`가 비면 스킵. **오늘부터 `d=0..daysToCheck-1`까지 날짜를 하루씩 더하며** 그 날의 `dayOfMonth`가 `investment_days`에 포함되면 `{ id, paymentDate, monthly_amount, dayOfMonth }` 추가 (`:198-214`).
  - `withinDays=1`이면 오늘 하루만 검사(라벨 "오늘"). `paymentDate` 오름차순 정렬 (`:215`).
- `getUpcomingPaymentsInRange(items, fromDate, toDate)` (`:228-257`):
  - `daysToCheck = differenceInDays(to, from) + 1`(양끝 포함). `from`부터 하루씩, `checkDate > to`면 break (`:233-245`).
  - 나머지 로직 동일.
- 두 함수 모두 **만기(period_years) 필터를 하지 않는다.** (캘린더의 `getPaymentEventsForMonth`와 달리 시작일/만기일을 보지 않고 `investment_days`만 본다.)

### 6-2. 미완료 필터 + 더보기/접기 — `useUpcomingInvestments`
위치: `app/hooks/upcoming/useUpcomingInvestments.ts`
- `usePaymentHistory()`의 `completedPayments`/`isLoading` 사용 (`:21`).
- 필터 훅(`useUpcomingInvestmentsFilter`)·완료 훅(`useUpcomingInvestmentsCompletion`)을 조합 (`:25-28`).
- `items` 계산 (`:31-48`):
  - 프리셋이 `'custom'`이고 from/to가 있으면 `getUpcomingPaymentsInRange`, 아니면 `getUpcomingPayments(records, selectedDays)`.
  - 각 payment를 `{ investment, paymentDate, dayOfMonth }`(`DisplayItem`)로 매핑 (`records.find(r => r.id === p.id)`).
- **미완료 필터** `visibleItems` (`:51-62`): `isLoading`이면 빈 배열, 아니면 `items.filter(item => !isPaymentCompleted(completedPayments, id, y, m, d))`. → **이미 완료한 건은 목록에서 사라진다.**
- **slice 5 더보기** (`:65-67`): `INITIAL_VISIBLE_COUNT = 5` (`:18`). `displayItems = expanded ? visibleItems : visibleItems.slice(0, 5)`, `hasMore = visibleItems.length > 5`, `remainingCount = visibleItems.length - 5`.
- 반환에 필터 상태/액션, `expanded`/`setExpanded`, 완료 액션(`toggleComplete`,`handleUndo`,`pendingUndo`), `displayItems`/`hasMore`/`remainingCount`/`visibleItemsCount`/`isLoading` (`:69-96`).

### 6-3. 기간 필터 — `useUpcomingInvestmentsFilter`
위치: `app/hooks/upcoming/useUpcomingInvestmentsFilter.ts`
- `PRESET_OPTIONS`: `오늘(1)`, `3일(3)`, `7일(7)`, `보름(15)`, `한달(30)`, `1년(365)` (`:5-12`).
- 상태: `selectedPreset('preset'|'custom')`, `selectedDays(기본 7)`, `customDateRange`(기본 오늘~+6일) (`:15-20`).
- `selectPreset(days)` → preset 모드 + days 세팅. `selectCustomPreset()` → custom 모드 + 오늘~+6일 초기화 (`:22-31`).
- `rangeLabel`: custom이면 `M월 d일 - M월 d일`, 아니면 프리셋 라벨 (`:33-38`).

### 6-4. 완료 처리 — `useUpcomingInvestmentsCompletion`
위치: `app/hooks/upcoming/useUpcomingInvestmentsCompletion.ts`
- `usePaymentHistory().togglePayment` 사용. `usePaymentCompletion`과 거의 동일 구조이나 **`PendingUndo`가 `{ investmentId, date: Date, dayOfMonth }`** 로 Date 객체를 담는다 (`:8-12`).
- `toggleComplete(investmentId, date, dayOfMonth)` (`:38-56`): `formatDate(date)` → `togglePayment(id, dateStr, false)` → `awardToryInvestmentComplete({ amount: 10 })` → `toastSuccess('🌰 +10 도토리')` → 5초 Undo 타이머.
- `handleUndo()` (`:58-70`): `togglePayment(id, dateStr, true)`로 취소(DELETE).

### 6-5. Upcoming UI — `UpcomingInvestments` + `UpcomingInvestmentsList`
위치: `app/components/UpcomingInvestments.tsx`, `app/components/UpcomingInvestmentsSections/UpcomingInvestmentsList.tsx`
- 카드 제목 **"이번 달 체크리스트"** (`bell-yellow.png` 아이콘) (`UpcomingInvestments.tsx:66-75`).
- 우상단 드롭다운으로 프리셋 선택 + "기간 선택"(custom). custom이면 `DateRangePicker` 노출 (`:77-113`).
- `visibleItemsCount === 0`이면 `UpcomingInvestmentsEmptyState`, 아니면 리스트 (`:115-123`).
- `records.length === 0`이거나 `isLoading`이면 카드 자체를 렌더 안 함(`return null`) (`:59-60`).
- 리스트 행: 아바타 + 종목명 + `formatPaymentDateShort(paymentDate)`("M/d (요일)") + 금액(주 모드면 `N주`, 아니면 `formatCurrency(monthly_amount)`) + "완료하기" 버튼 (`UpcomingInvestmentsList.tsx:36-100`). 행 클릭 → `/investment?id=`.
- **더보기/접기 버튼**: `hasMore`일 때 `expanded ? '접기' : '${remainingCount}건 더 보기'` (`:102-111`).
- Undo 토스트: `pendingUndo`면 하단 고정 토스트 + "되돌리기" (`UpcomingInvestments.tsx:126-140`). (`UndoToastSection`과 별개로 인라인 구현.)

---

## 7. 사용 훅 표 (입력 / 출력 / 책임)

| 훅 | 위치 | 입력 | 주요 출력 | 책임 |
|---|---|---|---|---|
| `useCalendar` | `app/hooks/calendar/useCalendar.ts` | (없음) | `currentMonth, year, month, calendarDays, selectedDate, slideDirection, isPickerOpen, scrollTick` + `goToPrevMonth/NextMonth/Month/Today, selectDate, clearSelection, openPicker/closePicker, isCurrentMonth` | 월 상태·선택일·슬라이드 방향·스크롤 틱·피커 토글 관리. `calendarDays`(앞 null 패딩) 생성. 날짜/월 이동 시 `track` 호출 |
| `useCalendarEvents` | `app/hooks/calendar/useCalendarEvents.ts` | `{ records, year, month, isEventCompleted }` | `activeRecords, eventsForMonth, eventsByDay, getDayStatus` | 활성 투자 필터 → 월 이벤트 계산 → 일별 상태(`getDayStatus`) 판정 |
| `useCalendarCollapse` | `app/hooks/calendar/useCalendarCollapse.ts` | `{ selectedDate }` | `isCollapsed` + `onListScroll/onTouchStart/Move/End, toggleCollapsed` | 스크롤/터치 제스처로 그리드 접힘(주 보기)/펼침(월 보기) 판정, 자동 스크롤 락 |
| `useMonthPicker` | `app/hooks/calendar/useMonthPicker.ts` | `initialYear` | `viewYear, slideDirection, goPrevYear, goNextYear` | 피커 시트의 연도 스테퍼 상태 |
| `usePaymentCompletion` | `app/hooks/payment/usePaymentCompletion.ts` | (없음) | `isEventCompleted, handleComplete, handleUndo, pendingUndo` | 캘린더 이벤트 완료/Undo + 토리 보상 + 5초 토스트 |
| `usePaymentHistory` | `app/hooks/payment/usePaymentHistory.ts` | (없음, `useAuth`로 user) | `completedPayments, retroactivePayments, isLoading, togglePayment, toggleRetroactivePayment, markAllRetroactivePaid, refetch` | `payment_history` 조회/낙관적 토글/시세 캡처/소급/일괄. **모든 완료 토글의 단일 DB 진입점** |
| `useMonthlyPaymentStatus` | `app/hooks/payment/useMonthlyPaymentStatus.ts` | (없음) | `isCompleted(recordId), toggle(record), isLoading` | 홈 목적그룹 카드용. 이번 달 캐논컬 납입일(가장 빠른 investment_day, 없으면 1일) 기준 완료 판정 |
| `usePaymentPagination` | `app/hooks/payment/usePaymentPagination.ts` | `(fullPaymentHistory, itemId)` | `paymentHistory, hasMorePaymentHistory, loadMore` | 투자 상세의 월별 내역 페이지네이션(초기 6, +10). 캘린더 미사용 |
| `useUpcomingInvestments` | `app/hooks/upcoming/useUpcomingInvestments.ts` | `records` | `displayItems, hasMore, remainingCount, visibleItemsCount, expanded/setExpanded, isLoading` + 필터/완료 위임 | Upcoming 카드 메인. 추출→미완료 필터→slice 5 |
| `useUpcomingInvestmentsFilter` | `app/hooks/upcoming/useUpcomingInvestmentsFilter.ts` | (없음) | `selectedPreset, selectedDays, customDateRange, selectPreset, selectCustomPreset, rangeLabel` | 기간 프리셋/커스텀 범위 상태 |
| `useUpcomingInvestmentsCompletion` | `app/hooks/upcoming/useUpcomingInvestmentsCompletion.ts` | (없음) | `pendingUndo, toggleComplete, handleUndo` | Upcoming 행 완료/Undo + 토리 보상 + 5초 토스트 |

보조 순수 함수: `getPaymentEventsForMonth`(`stats.ts`), `isPaymentCompleted`(`payment-completion.ts`), `getUpcomingPayments`/`getUpcomingPaymentsInRange`(`date.ts`), `buildMonthDayGroups`/`formatGroupLabel`(`calendar-agenda.ts`), `awardToryInvestmentComplete`(`tory-raising/...`), `capturePriceForPayment`(`payment-capture.ts`), `writePaymentHistoryRow`/`bulkUpsertRetroactiveRows`(`payment-history-db.ts`).

---

## 8. 납입 기록 데이터 구조 — `PaymentHistoryMap`

```ts
export type PaymentHistoryMap = Map<string, Set<string>> // recordId -> Set<YYYY-MM-DD>
```
위치: `app/hooks/payment/usePaymentHistory.ts:11`.

- **키**: `record_id`(투자 ID). **값**: 완료된 날짜 문자열 `Set`.
- 날짜 문자열 포맷은 `isPaymentCompleted`/토글 양쪽에서 `${y}-${MM}-${DD}`로 zero-pad (`payment-completion.ts:10`, `usePaymentCompletion.ts:32`).
- **자동(auto, `is_retroactive=false`)**: 실제 납입일(YYYY-MM-DD) 1행 = 1회 납입. `completedPayments`에 적재. 캘린더 점·아젠다·Upcoming·홈 체크리스트가 이걸 본다.
- **소급(retroactive, `is_retroactive=true`)**: 앱 등록(`records.created_at`) 이전 기간을 월 단위로 입력. `payment_date = 'YYYY-MM-01'`로 저장(레코드-월당 최대 1개). `retroactivePayments`에 분리 적재 (`usePaymentHistory.ts:38-44`).
- `fetchHistory`가 `is_retroactive` 플래그로 두 맵을 나눈다. 캘린더의 완료 판정(`getDayStatus`, `isEventCompleted`)은 **auto 맵만** 참조.
- 조회 판정은 O(1): `completedPayments.get(id)?.has(dateStr) ?? false` (`payment-completion.ts:11`).

---

## 9. 상태별 UI / 엣지 케이스

상태별 UI:
- 캘린더 점: completed(green)·missed(red)·scheduled(grey)·null(없음) (`CalendarGridSection.tsx:141-153`).
- 아젠다 헤더: 빈 날 `· 예정 없음`, 과거 미완료 `· 미완료 N`(red), 선택일 `text-brand-600 font-semibold` (`MonthAgendaSection.tsx:97-107`).
- 이벤트 행: 완료 `✓ 완료됨`, 미완료 `완료하기` 버튼 (`PaymentEventRow.tsx:69-85`).
- Upcoming: 완료 시 목록에서 제거, 빈 목록은 EmptyState, 5건 초과 시 더보기/접기.
- Undo 토스트: 완료 후 5초간 하단 고정 "완료됨 / 되돌리기".

엣지 케이스(코드 근거):
- **그 달에 없는 날짜**(예: 2월 30·31일 investment_day): `day > daysInMonth`로 스킵 → 그 달엔 이벤트 미생성 (`stats.ts:53`). Upcoming 쪽도 `days.includes(checkDate.getDate())` 이므로 존재하지 않는 날은 매칭 안 됨.
- **investment_days 미설정**: 캘린더·Upcoming 모두 이벤트 0개 (`stats.ts:49`, `date.ts:200-201`).
- **만기 지난 목표형 투자**: 캘린더는 `activeRecords` 필터(`isCompleted`)로 제외 (`useCalendarEvents.ts:23-35`). **단 Upcoming은 만기 필터 없음** → 만기 후에도 investment_days만 맞으면 목록에 뜰 수 있음(불일치 지점).
- **시작일 이전 날짜**: `paymentDate < startDate` 스킵(캘린더). Upcoming은 시작일을 보지 않음(불일치 지점).
- **모두 완료된 과거 날**: missed가 아닌 completed (allCompleted 우선) (`useCalendarEvents.ts:62-64`).
- **시세 캡처 실패**: 완료는 그대로 진행되고 `captured_price=null`로 저장 + `priceCaptureFailed` 토스트 (`usePaymentHistory.ts:93-95`).
- **DB 토글 실패**: 낙관적 변경을 `fetchHistory()`로 롤백 (`usePaymentHistory.ts:101-104`).
- **같은 날 여러 종목 완료**: 토리 보상은 `paymentDateYMD` 멱등이라 같은 날짜의 첫 1건만 +10 (`awardToryInvestmentComplete.ts:115-124`).
- **Undo 후 토리**: 행은 삭제되나 적립된 토리는 환수되지 않음.
- **자정 경과/날짜 선택 자동 스크롤**: `getDayStatus`/`isCurrentMonth`가 매 렌더 `new Date()` 평가(`useCalendar.ts:26-29`); collapse는 자동 스크롤 동안 800ms 락(`useCalendarCollapse.ts:131`).
- **미인증**: 캘린더 페이지는 `/login` redirect (`page.tsx:66-69`); `usePaymentHistory`는 user 없으면 빈 맵 (`usePaymentHistory.ts:21-26`).

---

## 10. 분석 이벤트 (`track`)

`track`/`monthOffset`/`countBucket`는 `app/lib/analytics.ts`(각각 `:26`, `:75`, `:90`).

| 이벤트명 | 발생 위치 | 파라미터 |
|---|---|---|
| `calendar_date_select` | `useCalendar.ts:84` (날짜 선택) | (없음) |
| `calendar_date_deselect` | `useCalendar.ts:80` (같은 날 재탭 해제) | (없음) |
| `calendar_go_today` | `useCalendar.ts:95` ("오늘" 단축) | (없음) |
| `payment_complete` | `usePaymentHistory.ts:99` (자동 완료 토글) | `{ month_offset, is_retroactive: false }` |
| `payment_uncheck` | `usePaymentHistory.ts:97` (자동 취소 토글) | `{ month_offset, is_retroactive: false }` |
| `payment_complete` / `payment_uncheck` | `usePaymentHistory.ts:127-129` (소급 토글) | `{ month_offset, is_retroactive: true }` |
| `payment_complete_bulk` | `usePaymentHistory.ts:159` (소급 일괄) | `{ count_bucket }` |

- `month_offset` = `monthOffset(dateYMD)`: 당월 0, 지난달 -1, 다음달 +1 (`analytics.ts:75-80`).
- `count_bucket` = `countBucket(n)`: `1_3`/`4_6`/`7_12`/`>=13` (`analytics.ts:90-95`).
- 토리 보상(`awardToryInvestmentComplete`)은 `track`을 직접 호출하지 않고 토스트만 띄운다. 캘린더 날짜 점 색 표시 자체엔 별도 이벤트 없음.

---

## 11. 관련 DB 테이블·컬럼 — `payment_history`

타입 정의: `types/database.types.ts:65-105`. 마이그레이션: `supabase/migrations/add_is_retroactive_to_payment_history.sql`, `supabase/migrations/20260505120100_add_captured_fields_to_payment_history.sql`.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | string (uuid) | PK |
| `user_id` | string | 사용자. 조회/쓰기 모두 `eq(user_id)` |
| `record_id` | string | FK → `records.id` (`payment_history_record_id_fkey`) |
| `payment_date` | string (date) | auto는 `YYYY-MM-DD`(실제 납입일), 소급은 `YYYY-MM-01`(월 단위) |
| `is_retroactive` | boolean | `NOT NULL DEFAULT false`. auto/소급 구분 |
| `captured_shares` | number \| null | 매수 시점 캡처 주수. `CHECK(NULL or > 0)`. 소급은 NULL |
| `captured_price` | number \| null | 매수 시점 1주 시세(원화). `CHECK(NULL or > 0)`. fallback 전부 실패 시 NULL |
| `completed_at` | string | 완료 시각(기본값 존재) |
| `created_at` | string | 행 생성 시각 |

제약/인덱스(마이그레이션 근거):
- `is_retroactive`: `NOT NULL DEFAULT false`로 추가(기존 행 안전, Breaking 0).
- 부분 유니크 인덱스 `payment_history_retro_unique_idx ON (record_id, payment_date) WHERE is_retroactive = true` — 소급은 레코드-월당 1개.
- 조회 인덱스 `payment_history_record_retro_idx ON (record_id, is_retroactive)`.
- upsert 충돌키: `onConflict: 'record_id, payment_date'`. auto는 갱신, 소급은 `ignoreDuplicates`.
- `captured_*` 두 컬럼은 `DEFAULT NULL`로 추가(구버전 앱 무영향).

> CLAUDE.md의 스키마 호환성 원칙(컬럼 추가는 DEFAULT 필수 / 기존 행 파괴 금지)을 두 마이그레이션 모두 준수한다.

---

## 12. 파일 경로 인덱스 (file_path:line)

페이지/뷰
- `app/calendar/page.tsx:17` — 캘린더 컨테이너(훅 조합 + props 전달)
- `app/calendar/page.tsx:66` — 미인증 `/login` redirect
- `app/components/CalendarView.tsx:60` — 전체 레이아웃(헤더+그리드+스크롤 아젠다)
- `app/components/CalendarView.tsx:90` — 그리드 좌우 스와이프 월 이동
- `app/components/CalendarView.tsx:158` — `data-calendar-scroll` 스크롤 컨테이너

캘린더 섹션
- `app/components/CalendarSections/CalendarHeaderSection.tsx:16` — 상단 앱바/월 캐럿/피커 트리거
- `app/components/CalendarSections/CalendarGridSection.tsx:44` — 날짜 그리드
- `app/components/CalendarSections/CalendarGridSection.tsx:114` — 셀별 `getDayStatus` 적용
- `app/components/CalendarSections/CalendarGridSection.tsx:141` — 상태 점 색 매핑
- `app/components/CalendarSections/CalendarGridSection.tsx:88` — 접힘 시 주 행 숨김
- `app/components/CalendarSections/MonthAgendaSection.tsx:21` — 월 전체 아젠다 리스트
- `app/components/CalendarSections/MonthAgendaSection.tsx:62` — scrollTick 기반 스크롤 동기화
- `app/components/CalendarSections/MonthAgendaSection.tsx:108` — 이벤트 행 렌더
- `app/components/CalendarSections/PaymentEventRow.tsx:17` — 이벤트 행(완료/완료하기)
- `app/components/CalendarSections/MonthPickerSheet.tsx:19` — 연도·월 바텀 시트
- `app/components/CalendarSections/UndoToastSection.tsx:6` — Undo 토스트(캘린더)

캘린더 훅
- `app/hooks/calendar/useCalendar.ts:10` — 월/선택일/스크롤틱 상태, 네비게이션
- `app/hooks/calendar/useCalendar.ts:31` — `calendarDays` 생성(null 패딩)
- `app/hooks/calendar/useCalendar.ts:72` — `selectDate`(재탭 해제 + track)
- `app/hooks/calendar/useCalendarEvents.ts:16` — 활성 투자/월 이벤트/일별 상태
- `app/hooks/calendar/useCalendarEvents.ts:55` — `getDayStatus`
- `app/hooks/calendar/useCalendarCollapse.ts:24` — 접기/펼치기 제스처 판정
- `app/hooks/calendar/useCalendarCollapse.ts:126` — 날짜 선택 자동 스크롤 락
- `app/hooks/calendar/useMonthPicker.ts:7` — 피커 연도 스테퍼

납입 훅/완료
- `app/hooks/payment/usePaymentCompletion.ts:12` — 캘린더 완료/Undo + 토리 보상
- `app/hooks/payment/usePaymentCompletion.ts:31` — `handleComplete`
- `app/hooks/payment/usePaymentHistory.ts:11` — `PaymentHistoryMap` 타입
- `app/hooks/payment/usePaymentHistory.ts:20` — `fetchHistory`(auto/retro 분리)
- `app/hooks/payment/usePaymentHistory.ts:58` — `applyOptimistic`
- `app/hooks/payment/usePaymentHistory.ts:74` — `togglePayment`(시세 캡처+upsert/delete+track)
- `app/hooks/payment/usePaymentHistory.ts:113` — `toggleRetroactivePayment`
- `app/hooks/payment/usePaymentHistory.ts:143` — `markAllRetroactivePaid`
- `app/hooks/payment/useMonthlyPaymentStatus.ts:33` — 홈 체크리스트 이번 달 완료 판정

다가오는 투자(Upcoming)
- `app/hooks/upcoming/useUpcomingInvestments.ts:20` — 추출/미완료 필터/slice 5
- `app/hooks/upcoming/useUpcomingInvestments.ts:51` — `visibleItems`(미완료 필터)
- `app/hooks/upcoming/useUpcomingInvestments.ts:65` — `displayItems`/`hasMore`/`remainingCount`
- `app/hooks/upcoming/useUpcomingInvestmentsFilter.ts:5` — `PRESET_OPTIONS`
- `app/hooks/upcoming/useUpcomingInvestmentsFilter.ts:14` — 필터 상태/라벨
- `app/hooks/upcoming/useUpcomingInvestmentsCompletion.ts:24` — Upcoming 완료/Undo + 토리 보상
- `app/components/UpcomingInvestments.tsx:40` — "이번 달 체크리스트" 카드
- `app/components/UpcomingInvestmentsSections/UpcomingInvestmentsList.tsx:21` — 행 + 더보기/접기

순수 함수/유틸
- `app/utils/stats.ts:19` — `getPaymentEventsForMonth`
- `app/utils/payment-completion.ts:3` — `isPaymentCompleted`
- `app/utils/calendar-agenda.ts:14` — `buildMonthDayGroups`
- `app/utils/calendar-agenda.ts:37` — `formatGroupLabel`
- `app/utils/date.ts:190` — `getUpcomingPayments`
- `app/utils/date.ts:228` — `getUpcomingPaymentsInRange`
- `app/utils/date.ts:149` — `isCompleted`(만기 판정)
- `app/utils/date.ts:289` — `formatPaymentDateShort`
- `app/utils/payment-capture.ts:27` — `capturePriceForPayment`
- `app/utils/payment-history-db.ts:8` — `writePaymentHistoryRow`
- `app/utils/payment-history-db.ts:61` — `bulkUpsertRetroactiveRows`
- `app/utils/tory-raising/awardToryInvestmentComplete.ts:108` — 토리 +10(하루 멱등)
- `app/lib/analytics.ts:75` — `monthOffset`
- `app/lib/analytics.ts:90` — `countBucket`

타입/DB
- `app/types/investment.ts:19` — `Investment` 인터페이스
- `app/types/investment.ts:112` — `getStartDate`
- `types/database.types.ts:65` — `payment_history` Row/Insert/Update
- `supabase/migrations/add_is_retroactive_to_payment_history.sql:1` — `is_retroactive` + 인덱스
- `supabase/migrations/20260505120100_add_captured_fields_to_payment_history.sql:13` — `captured_shares`/`captured_price`
