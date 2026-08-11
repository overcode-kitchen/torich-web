# 목표(Goal) 기능 상세 분석

토리치(Torich)의 **목표 기반 투자(Goal-Based Investing)** 기능 전체를 실제 구현 코드 기준으로 분석한 문서다. 생성(`/goal/new`) → 상세(`/goal/detail?id=`) → 편집(`/goal/detail/edit?id=`) → 투자 연결/해제 → 진행도 계산까지를 다룬다.

> 본 문서의 모든 계산식·동작 설명은 코드 인용 기반이며, 파일·라인은 [12. 파일 경로 인덱스](#12-파일-경로-인덱스)에 정리했다.

---

## 1. 기능 개요 — Goal-Based Investing 개념

"왜 모으는가"(목적)를 1급 엔티티로 두고, 흩어진 투자(`records`)를 목적 아래에 묶어 **목적별 진척도**를 보여주는 기능이다.

- **goals 테이블**이 신규 추가되고, `records.goal_id`(nullable, FK)로 투자를 목적에 N:1로 연결한다.
- 목적은 `target_amount`(목표 금액)와 `target_date`(마감일, 선택)를 가지며, 연결된 투자들의 **실제 납입액 + external_amount(앱 밖에서 이미 모은 돈)** 를 합산해 진행률을 계산한다.
- 클라이언트가 Supabase SDK로 DB에 직접 접근하는 구조라, 마이그레이션은 신규 테이블/컬럼만 추가하고 `records`의 기존 컬럼·RLS는 건드리지 않았다 (`supabase/migrations/20260507120000_add_goals_and_link_records.sql:1-3`).

### 핵심 데이터 모델 (`app/types/goal.ts`)

```ts
interface Goal {
  id, user_id, name,
  target_amount: number,            // 목표 금액 (원)
  target_date: string | null,       // 마감일 (YYYY-MM-DD) — 선택
  emoji: string | null,             // 3D 아이콘 키 (구버전: 이모지)
  memo: string | null,
  external_amount: number,          // 앱 밖에서 이미 모은 돈
  completed_at: string | null,      // 목표 금액 달성 시각 (자동 기록)
  archived_at: string | null,       // 보관(삭제) 시각
  notification_enabled: boolean,
  created_at, updated_at,
}
```

- `GoalProgress`(계산 결과): `currentValue` / `projectedValue` / `progressPercent` / `projectedProgressPercent` / `dDay` / `isCompleted`. 목표 금액이 없으면 `progressPercent`·`projectedProgressPercent`는 `null`.

### 화면 구성 (2개 진입 UI가 공존)

| UI | 진입점 | 마운트 여부 | 비고 |
| --- | --- | --- | --- |
| **GoalGroupSection** | 홈 메인 (`DashboardContent.tsx:73`) | **현재 라이브** | 목적별 카드 + 묶인 투자 행. 메인 UI |
| GoalCardCarousel / GoalRow / GoalEmptyCTA (via `DashboardSections/GoalSection.tsx`) | — | **미마운트(레거시)** | `<GoalSection`을 import/렌더하는 곳이 없음. 코드만 존재 |

> **발견**: `app/components/DashboardSections/GoalSection.tsx`(+`GoalCardCarousel`, `GoalRow`, `GoalEmptyCTA`)는 어디에서도 렌더되지 않는다(`grep '<GoalSection'`, `import .../GoalSection'` 모두 0건). 실제 홈 목적 영역은 `GoalGroupSection`이며, 이 둘은 별개의 진행도/삭제 흐름을 갖는다. 본 문서는 양쪽을 모두 기술하되 라이브 경로(GoalGroupSection)를 기준으로 설명한다.

---

## 2. 목표 생성 플로우 — 멀티스텝 (A → B → C)

파일: `app/goal/new/page.tsx`, 상태 훅 `useGoalForm`(`add/useGoalForm.ts`)·`useGoalFlow`(`add/useGoalFlow.ts`).

### 2.1 스텝 구성

3단계 단일 페이지 플로우. 단계 ↔ 컴포넌트 매핑 (`new/page.tsx:20-24`):

| 단계 | 컴포넌트 | 질문 | 입력 |
| --- | --- | --- | --- |
| A | `GoalStepName` | "어떤 목적을 만들까요?" | 3D 아이콘 슬롯 + 이름 + 프리셋 칩 (5개) |
| B | `GoalStepAmount` | "얼마를 모으려고 하나요?" | 만원 단위 입력 + ±100만/±1,000만 빠른 조정 |
| C | `GoalStepDate` | "언제까지 모을까요? (선택)" | 마감일 바텀시트 (생략 가능) |

- 프로그레스 바: `GoalFlowHeader`가 3분할 바를 그리며, 현재 단계 이하를 채운다 (`GoalFlowHeader.tsx:14-18`).
- 단계 컴포넌트는 즉석에서 선택해 렌더 (`new/page.tsx:98-107`).

### 2.2 useGoalFlow — 단계 전환 상태기계

`STEP_ORDER = ['A','B','C']` 인덱스 기반 전·후진 (`useGoalFlow.ts:7,34-44`).

- `goNextStep()`은 전진 직전 `document.activeElement.blur()`를 호출해 **iOS 키보드 잔류를 방지**한다 (`useGoalFlow.ts:25-32`). `goPrevStep()`에는 blur 없음.
- `isAtFirstStep`(A) / `isAtLastStep`(C) 플래그 제공.

### 2.3 useGoalForm — 폼 값/변환

- 모든 값을 **문자열로 보관**(`GoalFormValues`)하고, 금액은 만원↔원 변환을 컴포넌트에서 처리.
- `EMPTY` 기본값: `external_amount: '0'`, `notification_enabled: true` (`useGoalForm.ts:16-24`).
- `fromGoal(goal)`로 편집 시 초기값 채움 (`useGoalForm.ts:26-36`).
- `toCreateInput()`: trim + 숫자 변환, 빈 문자열은 `null`로 정규화 (`useGoalForm.ts:38-48`).
  - `target_date`/`emoji`/`memo`는 `trim() || null`, `external_amount`는 `Number() || 0`.
- `isValid`: **이름만 필수**. "목표 금액은 비워둔 채 만들 수 있고 나중에 채울 수 있다" (`useGoalForm.ts:72-73`).

### 2.4 단계별 진행 가능 조건 (`new/page.tsx:56-60`)

```
canAdvance =
  step A → values.name.trim().length > 0
  step B → Number(values.target_amount) > 0
  step C → true            // 마감일은 선택, 항상 통과
```

> 주의: 폼의 `isValid`(이름만 필수)와 별개로, **단계 B에서는 금액 > 0이어야 다음으로 넘어간다.** 즉 생성 플로우를 끝까지 밟으면 금액이 강제되지만, 편집 화면(`GoalFormSection`)에서는 금액을 비울 수 있다.

### 2.5 preset query param (빈 화면 칩에서 진입)

홈 빈 화면(`EmptyState.tsx`)의 프리셋 칩을 누르면 `/goal/new?preset=<목적이름>`으로 이동한다 (`EmptyState.tsx:13-20`).

`/goal/new` 마운트 시 `searchParams.get('preset')`을 읽어, `GOAL_PRESETS`에서 이름이 일치하는 프리셋을 찾아 **이름·아이콘을 미리 채운다** (`new/page.tsx:46-54`):

```ts
const matched = GOAL_PRESETS.find((p) => p.name === preset)
if (matched) { setField('name', matched.name); setField('emoji', matched.iconKey) }
```

- 프리셋 목록 (`constants/goal.ts:81-87`): 결혼 자금(ring), 주택 자금(house), 여행(airplane), 차(car), 이사(box).
- `emoji` 컬럼에는 **3D 아이콘 키 문자열**이 그대로 저장된다(이모지가 아님). `resolvePurposeIcon`이 키 또는 구버전 이모지 별칭으로 아이콘 메타데이터를 역해석한다 (`constants/goal.ts:68-73`).

### 2.6 제출 (`handleSubmit`, `new/page.tsx:62-75`)

```
goal = await createGoal(toCreateInput())   // userId + input INSERT
if (!goal) return
track('goal_create_success', { target_amount_bucket, has_deadline, has_external_amount, preset_used })
router.replace('/')                         // 홈으로 (back 시 폼 재진입 방지)
```

- `useGoalCreate.createGoal`: `userId` 없으면 `null` 반환, 있으면 `goals.insert({ user_id, ...input }).select().single()` (`data/useGoalCreate.ts:16-36`). 실패 시 `throw`(상위에서 try/catch 없이 호출되므로 unhandled 가능 — 단 GA 전송/`router.replace` 이전에 throw되어 라우팅은 막힘).
- `isCreating` 동안 CTA는 `loading`, `handleAction`은 재진입 차단 (`new/page.tsx:77-84`).

### 2.7 이탈 가드

- 첫 단계(A)에서 뒤로가기 → `ExitConfirmDialog` 노출 (`new/page.tsx:86-92, 125-132`).
- 확인 시 `useFlowBack({ rootPath: '/' })`의 `goBack()`. 같은 오리진 히스토리가 있으면 `router.back()`, 외부 referrer면 루트로 `replace` (`navigation/useFlowBack.ts:22-43`).

---

## 3. 목표 상세 — `/goal/detail?id=`

파일: `app/goal/detail/page.tsx`(Suspense 래퍼) → `GoalDetailClient.tsx`.

> **라우팅 정책 준수**: 동적 세그먼트(`[id]`) 대신 정적 경로 + `useSearchParams().get('id')`를 쓴다 (`GoalDetailClient.tsx:32-33`). Capacitor 정적 export 제약 때문(CLAUDE.md "Capacitor 정적 Export 라우팅 정책").

### 3.1 데이터 로드

```ts
const { goal, records, unlinkedRecords, isLoading, refetch, setGoal } = useGoalDetail(goalId, userId)
const { completedPayments, retroactivePayments } = usePaymentHistory()
const progress = useGoalProgress(goal, records, completedPayments, retroactivePayments)
const { updateGoal, archiveGoal, isUpdating } = useGoalUpdate(userId)
const { linkRecordToGoal, isLinking } = useInvestmentGoalLink(userId)
```

- `useGoalDetail`(`detail/useGoalDetail.ts`): goal 1건 + 사용자 전체 records를 받아 `goal_id === id`는 `records`, `!goal_id`는 `unlinkedRecords`로 분리 (`useGoalDetail.ts:49-56`). (단순화를 위해 records를 통째로 받아 클라이언트 필터링.)

### 3.2 화면 섹션 구성 (위→아래)

1. **헤더 영역** (`GoalDetailClient.tsx:160-193`): 제목, `isCompleted`면 "목표 달성! 🎉", 메모(`whitespace-pre-line`), 마감일 Alert(`dDayLabel(progress.dDay)` + `formatFullDate`).
2. **GoalProgressSection** — 진행률 바 / 모은 금액.
3. **GoalInfoSection** — 목표·마감일·이미 모은 돈·현재 모은 금액·예상 금액·남은 금액.
4. **LinkedRecordsSection** — 묶인 투자 목록(+풀기).
5. **UnlinkedRecordsSection** — 묶을 수 있는 투자(+묶기).
6. **GoalLifecycleSection** — 달성 축하 / 마감 경과 안내 카드(조건부).

### 3.3 진행도 표시

- **GoalProgressSection** (`GoalProgressSection.tsx`):
  - `progressPercent === null`(목표 금액 없음) → "지금까지 모은 금액"만 표시 + "목표 금액을 정하면 진행률을 볼 수 있어요" (`:17-31`).
  - 있으면 진행률 % + 바. 바 너비 `Math.min(progressPercent, 100)%`로 **100% 초과 시 시각적으로 capped**, 완료 시 색이 `bg-brand-500`→`bg-green-500` (`:43-50`).
  - 하단에 시작일(`created_at`)·마감일(`target_date`).
- **GoalInfoSection** (`GoalInfoSection.tsx`): `InvestmentField` 라벨/값 나열.
  - 목표 금액 미설정 시 "미설정", 마감일 없으면 "없음".
  - `remaining = Math.max(0, target_amount - currentValue)` (`:15`). `hasTarget`일 때만 "남은 금액" 노출.
  - "마감일 예상 금액"은 `projectedValue !== null`(=마감일 존재)일 때만 노출 (`:50-56`).

### 3.4 메뉴 (편집/삭제) — DropdownMenu

헤더 우측 ⋮ 버튼 (`GoalDetailClient.tsx:127-151`):

- **수정하기** → `router.push('/goal/detail/edit?id=' + goal.id)`.
- **삭제하기**(destructive, `isUpdating`이면 disabled) → `handleArchive()`.

`handleArchive` (`:76-85`):

```
window.confirm(`"${goal.name}"을(를) 삭제할까요? 묶였던 투자는 자유 상태로 돌아갑니다.`)
→ archiveGoal(goal.id)              // RPC archive_goal (아카이브 + 투자 언링크)
→ track('goal_delete', { entry_point: 'detail_menu' })
→ router.push('/')
```

> 표면적으로 "삭제"라 부르지만 실제로는 **아카이브(soft delete)** 다. 영구 삭제(`useGoalDelete`)는 UI 어디에서도 호출되지 않는다(미사용). [7. 아카이브 vs 완료](#7-아카이브-vs-완료) 참조.

### 3.5 투자 링크/언링크 (`useInvestmentGoalLink`)

- **묶기** (`handleLink`, `:87-97`): `linkRecordToGoal(recordId, goal.id)` → `track('goal_record_linked', { monthly_amount_bucket })` → `refetch()`.
- **풀기** (`handleUnlink`, `:99-102`): `linkRecordToGoal(recordId, null)` → `refetch()` (track 없음).
- `useInvestmentGoalLink.linkRecordToGoal` (`data/useInvestmentGoalLink.ts:21-40`): `records.update({ goal_id: goalId }).eq('id', recordId).eq('user_id', userId)`. `goalId`가 `string`이면 연결, `null`이면 해제. `isLinking` 플래그로 버튼 disabled.
  - 주석: `useInvestmentsUpdate.validColumns`에 `'goal_id'`가 추가되어 있어 구버전 앱 호환 안전 (`:11-13`).
- **LinkedRecordsSection** (`LinkedRecordsSection.tsx`): "묶인 투자 (n)", 각 행에 제목 + `월 {monthly_amount} · {모드라벨}` + "풀기" 버튼. 없으면 안내문. `modeLabel`: `period_years > 0`이면 "n년 목표", 아니면 "적립형" (`:13-16`).
- **UnlinkedRecordsSection** (`UnlinkedRecordsSection.tsx`): 후보가 0개면 **섹션 자체 미렌더**(`:23`). "'묶기'를 누르면 이 목적의 진척도에 합산돼요" 안내 + "묶기" 버튼.

### 3.6 자동 완료 기록 (effect)

상세 진입 시 진행도가 완료에 도달했는데 아직 `completed_at`이 비어 있으면 자동으로 완료 시각을 찍는다 (`GoalDetailClient.tsx:60-74`):

```
if (goal.completed_at === null && progress.isCompleted) {
  completedAt = now()
  updateGoal(goal.id, { completed_at: completedAt }).then(updated => {
    setGoal(updated)
    track('goal_completed', {
      target_amount_bucket, days_to_complete: daysBetween(created_at, completedAt), linked_record_count
    })
  })
}
```

> `completed_at` 기록은 **상세 페이지를 열어야** 트리거된다(백그라운드 잡 아님). 홈 카드에서는 `progress.isCompleted`(파생)로만 완료를 표시한다.

### 3.7 로딩/에러 상태

- 로딩: 스피너(`CircleNotch`).
- `!goal || !progress`: "목적을 찾을 수 없습니다." + 홈으로 버튼 (`:114-125`).

---

## 4. 목표 편집 — `/goal/detail/edit?id=`

파일: `app/goal/detail/edit/page.tsx` → `EditGoalClient.tsx`.

### 4.1 구조

- 바깥 `EditGoalClient`: `useGoalDetail(goalId, userId)`로 goal 로드 → 로딩/없음 처리 → `<EditForm goal={goal} ... />` (`EditGoalClient.tsx:121-168`).
- 뒤로가기 `rootPath`는 **상세로** 복귀: `goalId ? '/goal/detail?id='+goalId : '/'` (`:126-129`).
- 안쪽 `EditForm`: `useGoalForm(goal)`로 기존 값 채움, `GoalFormSection`을 `showOptionalFields`로 렌더 (메모·이미 모은 돈·마감일 알림 노출) (`:79-84`).

### 4.2 폼 (`GoalFormSection.tsx`)

생성 플로우와 달리 **한 화면에 전체 필드**. 만원↔원 변환 로직이 컴포넌트 내부에 있음 (`:29-50`):

- `wonToManwonDisplay`: 원→만원(`Math.floor(/10000)`, 콤마).
- `manwonInputToWon`: 입력 숫자 ×10000.
- `adjustWonByManwon`: 만원 단위 ±delta, **음수 방지**(`Math.max(0, ...)`).
- 빠른 조정 칩: +1,000만 / -1,000만 / +100만 / -100만 (`:52-57`).
- 프리셋 칩은 이름+아이콘 동시 적용(`applyPreset`).
- 마감일은 `GoalTargetDateField`(바텀시트 캘린더), 아이콘은 `PurposeIconSlot`(바텀시트 picker).

### 4.3 저장 + 적금 만기 미스매치 사전 안내 (케이스 A)

`EditForm`은 저장 직전 **묶인 적금 만기 > 새 종료일** 충돌을 검사한다 (설계: `.omc/specs/deep-interview-goal-savings-mismatch.md`).

- 묶인 records는 `useInvestmentsContext()`의 records에서 `r.goal_id === goal.id` 필터 (`:30, 35-38`).
- `detectMaturityMismatch(values.target_date, linkedRecords)` (`goal-status.ts:92-111`): 만기일이 종료일보다 **늦은**(`rDate > goalDate`) record 중 **가장 늦은 만기**를 반환. 케이스 B(만기 ≤ 종료일)는 `null`.
- `handleSubmit` (`EditGoalClient.tsx:50-56`): mismatch면 확인 모달을 띄우고, 없으면 바로 `doSubmit()`.
- `MaturityMismatchConfirmModal`(`Common/MaturityMismatchConfirmModal.tsx`) 3선택:
  - **그대로 진행**(`handleProceed`) → 입력값 그대로 저장 (런타임 정산 대기로 이어짐).
  - **종료일을 적금 만기로 맞추기**(`handleAlignDate`, `:63-68`) → `setField('target_date', recordMaturityDate)` 후 `doSubmit({ target_date: recordMaturityDate })`로 **override** 저장.
  - **취소** → 모달만 닫음.
- `doSubmit` (`:44-48`): `updateGoal(goal.id, { ...toCreateInput(), ...override })` → 성공 시 `router.replace('/goal/detail?id='+goal.id)`.

### 4.4 useGoalUpdate.updateGoal (`data/useGoalUpdate.ts:22-44`)

```
goals.update({ ...patch, updated_at: now() })
  .eq('id', id).eq('user_id', userId)
  .select('*').single()
```

`updated_at`은 매 수정마다 자동 갱신. `userId` 없으면 `null` 반환. 실패 시 `throw`.

---

## 5. 진행도 계산 — `useGoalProgress` (핵심)

파일: `app/hooks/goal/calculations/useGoalProgress.ts`. 외부 의존: `usePaymentHistory`(납입 이력 Map), `calculateSavingsMaturity`(`utils/savingsMaturity.ts`).

### 5.1 입력

- `goal`, `records`(전체), `completedPayments`(자동 납입 Map), `retroactivePayments`(소급 납입 Map).
- `PaymentHistoryMap = Map<recordId, Set<'YYYY-MM-DD'>>` — 납입 1건 = 1개의 날짜 원소 (`payment/usePaymentHistory.ts:11`).
- 훅 내부에서 `records.filter(r => r.goal_id === goal.id)`로 **묶인 것만** 계산 (`:148-156`).

### 5.2 실현 금액 — `sumRealizedAmount` (`:40-59`)

이미 확정된 금액의 합. **정산된 적금은 만기 총액으로 치환**하는 것이 케이스 B 처리의 핵심.

```
sumRealizedAmount(records, auto, retro):
  total = 0
  for r in records:
    if !r.monthly_amount or r.monthly_amount <= 0: continue          # 월납입 없는 record 제외

    if r.settled_at && r.record_type === 'savings':                  # 정산된 적금
        m = calculateSavingsMaturity(r)                              # 원금+이자 만기액
        if m: total += m.total; continue                            # 성공 시 만기총액 사용
        # 실패하면 아래 원금 합산으로 폴백

    total += paidCount(r.id, auto, retro) * r.monthly_amount         # 미정산: 실제 납입 횟수 × 월납입
  return total

paidCount(id) = (auto.get(id)?.size ?? 0) + (retro.get(id)?.size ?? 0)   # 자동+소급 납입 건수
```

> 즉, 미정산 record는 "**실제 체크한 납입 횟수 × 월납입액**"(payment_history 기반)으로 계산하고, 만기 정산이 끝난 적금은 그 시점 **원금+세전단리이자**(만기 총액)로 한 번에 반영한다. 정산됐는데 만기 계산이 불가하면 안전하게 원금(납입 횟수×월납입)으로 폴백.

### 5.3 만기 총액 — `calculateSavingsMaturity` (`utils/savingsMaturity.ts:33-67`)

적금 단리·세전 약식 추정 (세금·복리·우대금리 미반영):

```
n = monthsBetween(start, maturity)        # 가입~만기 개월수, 시작월 포함, 최소 0
principal = monthly × n
interest  = round( monthly × (rate/100) / 12 × n(n+1)/2 )
total     = principal + interest
```

- `maturity_date` 없거나 `interest_rate == null`이면 `null` 반환 (`:39-41`).
- `start`는 `getStartDate(r)` = `start_date` 우선, 없으면 `created_at` (`types/investment.ts:112-117`).
- `months <= 0`이면 `null`.

### 5.4 미래 적립 원금 — `sumFuturePrincipal` (`:62-88`)

오늘부터 `byDate`(=마감일)까지 추가로 적립될 **원금**(이자 제외)의 합. **투자 만기 cap** 적용.

```
sumFuturePrincipal(records, today, byDate):
  monthsAhead = max(0, floor( monthsBetween(today, byDate) ))
  if monthsAhead == 0: return 0

  total = 0
  for r in records:
    if !r.monthly_amount or <= 0: continue
    if r.settled_at: continue                          # 정산된 record는 미래 적립 없음

    periodMonths = (r.period_years ?? 0) × 12
    allowedMonths = monthsAhead
    if periodMonths > 0:                               # 만기 있는 투자 → cap
        elapsed   = max(0, floor( monthsBetween(start, today) ))
        remaining = max(0, periodMonths - elapsed)     # 만기까지 남은 개월
        allowedMonths = min(monthsAhead, remaining)    # 마감일 vs 만기 중 빠른 쪽까지만
    total += allowedMonths × r.monthly_amount          # period_years 없으면(적립형) 무제한
  return total
```

- `monthsBetween`(`:16-22`)는 일(day) 차이를 `/30` 보정해 더한다(부드러운 월수).

### 5.5 최종 조립 — `calculateGoalProgress` (`:90-131`)

```
today = now()
targetDate = goal.target_date ? new Date(...) : null

realizedAmount = sumRealizedAmount(linked, auto, retro)
currentValue   = goal.external_amount + realizedAmount          # 외부자산 + 실현금액

projectedValue =
  targetDate != null
    ? external_amount + realizedAmount + sumFuturePrincipal(linked, today, targetDate)
    : null                                                       # 마감일 없으면 예상값 없음

hasTarget = goal.target_amount > 0
progressPercent          = hasTarget ? round(currentValue / target_amount × 100) : null
projectedProgressPercent = (hasTarget && projectedValue != null)
                             ? round(projectedValue / target_amount × 100) : null

dDay        = targetDate ? diffDays(today, targetDate) : null    # round((target - today)/MS_PER_DAY)
isCompleted = hasTarget && currentValue >= target_amount         # 현재값 기준(예상값 아님)

return { goalId, currentValue: round, projectedValue: round|null,
         progressPercent, projectedProgressPercent, dDay, isCompleted }
```

핵심 규칙:

- **목표 금액 0/미설정** → `progressPercent`·`isCompleted` 계산 안 함(각각 `null`/`false`). 완료 판정 대상에서 제외.
- **마감일 없음** → `projectedValue`·`projectedProgressPercent`·`dDay` 모두 `null`.
- **완료 판정은 `currentValue`(실현 기준)** 으로만, 예상값은 무관.
- `dDay`: 양수 D-n / 0 D-DAY / 음수 D+n (`utils/goal-format.ts:5-10`의 `dDayLabel`이 라벨링).

### 5.6 복수 계산 — `useGoalsProgress` (`:162-184`)

여러 목적을 한 번에 계산해 `Map<goalId, GoalProgress>` 반환(홈 카드 캐러셀/그룹용). 동일 `calculateGoalProgress`를 목적별로 호출.

---

## 6. 목표 그룹/캐러셀 (홈)

### 6.1 useGoalGroups (`data/useGoalGroups.ts`) — 라이브 경로

`records`(prop)를 받아, `userId`는 자체적으로 `supabase.auth`에서 가져온다(주석: Dashboard에 props 추가 금지, `:30-32`).

- 내부에서 `useGoals` + `usePaymentHistory` + `useGoalsProgress` 재사용 (`:44-52`).
- `groups`(`:54-72`): 목적마다 `{ goal, progress, records: linkedRecords, status }`. 목적 정렬 순서 유지.
- `status`는 `deriveGoalStatus({ goal, linkedRecords, accumulatedAmount: progress.currentValue, now })`로 파생 (`:59-64`).
- `unassignedRecords`(`:74-77`): `!r.goal_id`인 투자.
- `isLoading = goalsLoading || paymentsLoading`.

### 6.2 GoalGroupSection (`GoalSections/GoalGroupSection.tsx`) — 홈 메인

- `isLoading`이면 `null`. `groups.length === 0 && records.length === 0`이면 `<EmptyState/>`(목적·투자 둘 다 없을 때만) (`:31-36`).
- 목적별 `GoalGroupCard` + 미지정 투자용 `GoalGroupCard goal={null}` + 하단 "목적 만들기" 버튼(→ `track('goal_add_click', {entry_point:'dashboard_group'})` → `/goal/new`) (`:40-77`).
- 행 탭: 투자행 → `/investment?id=`, 목적 헤더 → `/goal/detail?id=`, 적립 추가 → `/add?goalId=`.

### 6.3 GoalGroupCard (`GoalSections/GoalGroupCard.tsx`)

- 헤더: 아이콘 + 이름 + (정산 대기 배지) + (D-day) + (진행률%). `goal && onSelectGoal`이면 헤더가 버튼(상세 이동), 미지정 카드면 비클릭 (`:90-101`).
- `status === 'pending_settlement'`면 "정산 대기" 배지 (`:69-73`).
- 본문: 묶인 record들을 `GoalGroupItemRow`로. 없으면 "아직 적립 항목이 없어요".
- 푸터: 목적 카드에만 "적립 항목 추가" 회색 바 (`:123-132`).

### 6.4 GoalGroupItemRow (`GoalSections/GoalGroupItemRow.tsx`)

- 좌측 스와이프 → 빨간 삭제 → `DeleteConfirmModal`(투자 삭제, `useSwipeToDelete` + `deleteInvestment`).
- 정산 완료 적금(`settled_at`)은 "완료하기" 버튼 대신 **"만기 완료" 배지**(`:51-53, 124-130`).
- 미정산은 이번 달 납입 토글 버튼(`isPaid` → "완료"/"완료하기").

### 6.5 레거시 캐러셀 (미마운트)

- `GoalCardCarousel`(`GoalSections/GoalCardCarousel.tsx`) + `GoalRow`(`GoalSections/GoalRow.tsx`): "내 목적" 카드에 `GoalRow`(목적 행 + 진행률 + D-day + 스와이프 삭제→archive)를 나열. `progressMap`으로 다중 진행도.
- `GoalEmptyCTA`: 목적 0·투자>0일 때의 안내 카드.
- 이들을 묶는 `DashboardSections/GoalSection.tsx`는 **어디서도 렌더되지 않음**(레거시). 삭제는 `archiveGoal` + `track('goal_delete', {entry_point:'swipe'})`.

---

## 7. 아카이브 vs 완료

두 개념이 **명확히 분리**되어 있다.

| | 완료(completed) | 아카이브(archived) |
| --- | --- | --- |
| 컬럼 | `completed_at` (timestamptz) | `archived_at` (timestamptz) |
| 의미 | 목표 금액 달성 | 보관(soft delete), 목록에서 숨김 |
| 트리거 | 상세 진입 시 `currentValue >= target_amount`면 자동 기록 (`GoalDetailClient.tsx:60-74`) | 사용자가 "삭제하기"/스와이프 |
| 연결 투자 | 유지 | **모두 언링크**(goal_id=NULL) |
| 되돌림 | (자동) | — |

### 7.1 archive_goal RPC (`migration:68-81`)

```sql
CREATE OR REPLACE FUNCTION archive_goal(p_goal_id uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE goals SET archived_at = now(), updated_at = now()
    WHERE id = p_goal_id AND archived_at IS NULL;     -- 멱등: 이미 보관됐으면 no-op
  UPDATE records SET goal_id = NULL
    WHERE goal_id = p_goal_id;                         -- 묶인 투자 자유화
END; $$;
```

- **SECURITY INVOKER**(기본값) → 호출자 RLS 컨텍스트에서 실행, `auth.uid()` 수동 검증 불필요. 함수가 단일 트랜잭션이라 **원자성** 보장(아카이브와 언링크가 함께 성공/실패) (`migration:65-67`).
- `useGoalUpdate.archiveGoal`(`data/useGoalUpdate.ts:46-61`)이 `supabase.rpc('archive_goal', { p_goal_id: id })`로 호출.

### 7.2 목록 분리 (`data/useGoals.ts:36-44`)

`goals.select('*').eq('user_id').order('target_date', { ascending: true, nullsFirst: false })`로 받은 뒤:
- `goals` = `archived_at === null` (활성), `archivedGoals` = `archived_at !== null` (보관함).
- 정렬: **마감일 오름차순, NULL은 맨 뒤** → 임박한 목적이 위로.

### 7.3 useGoalDelete — 미사용 영구 삭제

`useGoalDelete`(`data/useGoalDelete.ts`)는 `goals.delete()`(하드 삭제, `records.goal_id`는 FK `ON DELETE SET NULL`로 자동 NULL). 주석상 "archived 보관함에서 영구 제거 시 사용"이지만 **현재 어떤 컴포넌트도 호출하지 않는다**(grep 0건). 보관함 UI 자체가 미구현.

### 7.4 파생 상태 — `deriveGoalStatus` (`utils/goal-status.ts:33-51`)

홈 카드 배지용. 우선순위:

```
1. completed_at 있음            → 'completed'
2. 종료 트리거 미충족            → 'in_progress'
   (dateTriggered = target_date <= now, amountTriggered = target_amount>0 && accumulated>=target_amount)
3. 트리거 충족 + 묶인 적금에 '정산 대기' 존재 → 'pending_settlement'
4. 트리거 충족 + 대기 적금 없음  → 'completed'
```

- `isPendingSettlement(r, now)`(`:56-63`): `maturity_date` 있고 `!settled_at` 이고 만기 **전**(`maturity_date > now`).
- `isMaturedAndUnsettled`(`:69-76`): 만기 도달(`<= now`) + 미정산 — Phase 4 자동 정산 트리거용.

---

## 8. 사용 훅 표

| 훅 | 위치 | 입력 | 출력 | 책임 |
| --- | --- | --- | --- | --- |
| `useGoals` | `data/useGoals.ts` | `userId?` | `goals`, `archivedGoals`, `isLoading`, `refetch`, `setGoals` | 활성/보관 목적 목록 조회·정렬 |
| `useGoalCreate` | `data/useGoalCreate.ts` | `userId?` | `createGoal(input)`, `isCreating` | goals INSERT |
| `useGoalUpdate` | `data/useGoalUpdate.ts` | `userId?` | `updateGoal(id, patch)`, `archiveGoal(id)`, `isUpdating` | 수정(updated_at 자동) + 아카이브 RPC |
| `useGoalDelete` | `data/useGoalDelete.ts` | `userId?` | `deleteGoal(id)`, `isDeleting` | 하드 삭제 **(미사용)** |
| `useGoalGroups` | `data/useGoalGroups.ts` | `records` | `groups`, `unassignedRecords`, `isLoading` | 홈 그룹 데이터(목적별 묶음 + 파생 상태) |
| `useInvestmentGoalLink` | `data/useInvestmentGoalLink.ts` | `userId?` | `linkRecordToGoal(recordId, goalId\|null)`, `isLinking` | record.goal_id set/null |
| `useGoalProgress` | `calculations/useGoalProgress.ts` | `goal`, `records`, `auto`, `retro` | `GoalProgress \| null` | 단일 목적 진행도 |
| `useGoalsProgress` | `calculations/useGoalProgress.ts` | `goals[]`, `records`, `auto`, `retro` | `Map<id, GoalProgress>` | 복수 목적 진행도 |
| `useGoalDetail` | `detail/useGoalDetail.ts` | `id?`, `userId?` | `goal`, `records`, `unlinkedRecords`, `isLoading`, `refetch`, `setGoal` | 상세 1건 + 묶임/후보 분리 |
| `useGoalForm` | `add/useGoalForm.ts` | `initial?: Goal` | `values`, `setField`, `reset`, `isValid`, `toCreateInput` | 폼 상태/정규화(이름만 필수) |
| `useGoalFlow` | `add/useGoalFlow.ts` | — | `currentStep`, `isAtFirst/LastStep`, `goNext/PrevStep` | A→B→C 단계 상태기계(blur 처리) |

보조: `usePaymentHistory`(납입 Map, 진행도 입력), `useFlowBack`(뒤로가기), `useInvestmentsContext`(편집 화면 묶인 record 추출), `useSwipeToDelete`(행 스와이프 삭제).

---

## 9. 상태별 UI / 엣지 케이스

### 9.1 목표 금액 미설정 (`target_amount = 0`)
- 생성 플로우는 단계 B에서 금액>0을 요구하지만, 편집/이미 만든 목적은 금액 0 가능.
- `progressPercent`/`projectedProgressPercent` = `null`, `isCompleted` = `false`.
- 상세: 진행률 바 대신 "지금까지 모은 금액" + "목표 금액을 정하면 진행률을 볼 수 있어요". 정보 섹션 목표 금액 "미설정", "남은 금액" 미노출.
- 홈 카드: % 미표시(`percent !== null` 조건).

### 9.2 마감일 없음 (`target_date = null`)
- `projectedValue`/`projectedProgressPercent`/`dDay` 모두 `null`.
- 상세 헤더 마감일 Alert 미노출, "마감일 예상 금액" 미노출, 진행률 섹션 하단 마감일 미노출.
- 홈 카드 D-day 배지 미노출.

### 9.3 100% 초과 / 완료
- 진행률 바는 `Math.min(percent, 100)%`로 capped, 색은 green.
- 상세 헤더 "목표 달성! 🎉" + `GoalLifecycleSection`의 축하 카드는 **`completed_at !== null && isCompleted`** 조건(`GoalLifecycleSection.tsx:14-15`).
- `completed_at`은 상세 진입 effect로만 기록됨.

### 9.4 마감 경과 (D+)
- `GoalLifecycleSection`(`:17-19`): `dDay < 0 && archived_at === null && !isCompleted`면 "마감일이 지났어요" 카드 + 달성률 안내. (완료/보관된 목적엔 안 뜸.)

### 9.5 적금 만기 미스매치
- **케이스 A (만기 > 종료일)**: 편집 저장 시 `MaturityMismatchConfirmModal` 사전 안내(그대로/맞추기/취소).
- **케이스 B (만기 ≤ 종료일, 정산 완료 적금)**: 진행도에서 만기 총액(원금+이자)으로 합산. 사전 안내 대상 아님.
- 정산 대기 record가 있으면 홈 카드 "정산 대기" 배지.

### 9.6 묶인 투자 0 / 후보 0
- LinkedRecordsSection: "아직 묶인 투자가 없어요…" 안내.
- UnlinkedRecordsSection: 후보 0이면 섹션 자체 미렌더.

### 9.7 인증/식별자 부재
- `userId` 미확정: 데이터 훅들이 빈 결과/`null` 반환, mutate 함수는 `null`/no-op.
- `goalId` 부재(쿼리 누락): `useGoalDetail`이 로딩 종료 후 goal=null → "목적을 찾을 수 없습니다".

### 9.8 동시성/낙관성
- 링크/언링크 후 `refetch()`(낙관적 업데이트 없음 → 약간의 지연).
- `usePaymentHistory`는 토글 시 낙관적 반영 + 실패 시 refetch(진행도 입력에 영향).

---

## 10. 분석 이벤트 (track)

`track(event, params)` — GA4 전송, 모든 이벤트에 `platform` 자동 포함. 금액은 PII 보호를 위해 `amountBucket()` 구간 문자열로만 전송 (`lib/analytics.ts:26-69`).

| 이벤트 | 발생 위치 | 파라미터 |
| --- | --- | --- |
| `goal_create_click` | `EmptyState.tsx:14` | `entry_point: 'empty_state'`, `preset` |
| `goal_add_click` | `GoalGroupSection.tsx:70` / `GoalSection.tsx:55`(레거시) | `entry_point: 'dashboard_group' \| 'dashboard_empty' \| 'dashboard_carousel'` |
| `goal_create_success` | `new/page.tsx:66` | `target_amount_bucket`, `has_deadline`, `has_external_amount`, `preset_used`(프리셋명 또는 `'custom'`) |
| `goal_completed` | `GoalDetailClient.tsx:67` | `target_amount_bucket`, `days_to_complete`(`daysBetween`), `linked_record_count` |
| `goal_record_linked` | `GoalDetailClient.tsx:92` | `monthly_amount_bucket` |
| `goal_delete` | `GoalDetailClient.tsx:83`(`detail_menu`) / `GoalSection.tsx:50`(`swipe`, 레거시) | `entry_point` |

- 언링크/편집 저장에는 별도 track 없음.
- `amountBucket` 구간: `<100k / 100k_300k / 300k_500k / 500k_1m / 1m_3m / 3m_10m / >=10m`.

---

## 11. 관련 DB 테이블·컬럼

마이그레이션 `supabase/migrations/20260507120000_add_goals_and_link_records.sql` (안전성: 신규 테이블/컬럼만, `records` 기존 컬럼·RLS 불변).

### 11.1 `goals` (신규, `:6-23`)
`id`(uuid PK), `user_id`(FK auth.users, ON DELETE CASCADE), `name`, `target_amount`(numeric NOT NULL), `target_date`(date null), `emoji`, `memo`, `external_amount`(numeric NOT NULL DEFAULT 0), `completed_at`, `archived_at`, `notification_enabled`(bool NOT NULL DEFAULT true), `created_at`, `updated_at`.
- 인덱스: `idx_goals_user_id`, `idx_goals_archived(user_id, archived_at)`.
- RLS(`:26-43`): SELECT/INSERT/UPDATE/DELETE 모두 `auth.uid() = user_id` (records 패턴 동일).

### 11.2 `records.goal_id` (`:48-51`)
`uuid REFERENCES goals(id) ON DELETE SET NULL`, nullable. 인덱스 `idx_records_goal_id`.
- 구버전 앱 호환: `useInvestmentsUpdate.validColumns` 화이트리스트가 `goal_id`를 무시(또는 허용)하므로 안전.

### 11.3 `scheduled_notifications.goal_id` (`:55-63`)
`uuid REFERENCES goals(id) ON DELETE CASCADE`. Goal D-day 알림용. 인덱스 + partial unique(`(goal_id, scheduled_at, token) WHERE goal_id IS NOT NULL AND record_id IS NULL`)로 record 알림과 dedup.
- **발견**: 스키마/인덱스는 준비됐으나, 분석 대상 앱 코드에 `scheduled_notifications.goal_id`를 **실제로 INSERT하는 producer가 없다**(목적 D-day 알림 스케줄링 미구현 또는 별도 미포함). `notification_enabled`는 폼/스위치로 저장만 되고 소비처가 보이지 않음.
  - **확정(#59)**: 운영 DB에서 `select count(*) from scheduled_notifications where goal_id is not null` = **0**(대조군 `record_id` 기준 1,769건). Edge Function 5종 전체에 `goal` 문자열 0건, pg_cron에도 미등록. 서비스 시작 이래 목적 알림이 한 건도 예약된 적 없음이 확인됐다.
  - **해소(#59)**: `schedule-goal-notifications` Edge Function을 추가해 producer를 구현했다. 마감일 D-7/D-1/당일에 `notification_type = 'goal_deadline'`, `record_id = null`, `goal_id = 목적 id`로 예약한다. `notification_enabled`가 드디어 소비된다. 동작·차이점은 [docs/features/notifications.md](notifications.md) 1.1절, 배포·cron 등록은 [docs/notification-infra.md](../notification-infra.md) 7절 참조.

### 11.4 의존 테이블
- `records`(투자): `goal_id`, `monthly_amount`, `period_years`, `record_type`, `interest_rate`, `maturity_date`, `start_date`, `settled_at`, `created_at` 등이 진행도/상태 계산에 사용.
- `payment_history`(`record_id`, `payment_date`, `is_retroactive`): 실제 납입 횟수 산출(`usePaymentHistory`).

---

## 12. 파일 경로 인덱스

### 페이지/라우트
- 생성: `/Users/swimming_moon/Documents/HansolDev/tickle-moa/app/goal/new/page.tsx`
- 상세: `app/goal/detail/page.tsx`, `app/goal/detail/GoalDetailClient.tsx`
- 편집: `app/goal/detail/edit/page.tsx`, `app/goal/detail/edit/EditGoalClient.tsx`

### 홈 섹션 (GoalSections)
- 라이브: `app/components/GoalSections/GoalGroupSection.tsx`, `GoalGroupCard.tsx`, `GoalGroupItemRow.tsx`
- 레거시(미마운트): `GoalCardCarousel.tsx`, `GoalRow.tsx`, `GoalEmptyCTA.tsx`
- 래퍼: `app/components/DashboardSections/GoalSection.tsx`(레거시·미마운트), `DashboardContent.tsx:73`(GoalGroupSection 마운트), `EmptyState.tsx`(preset 칩)

### 폼 섹션 (GoalFormSections)
- `GoalFormSection.tsx`(편집 통합폼), `GoalFlowHeader.tsx`, `GoalStepName.tsx`, `GoalStepAmount.tsx`, `GoalStepDate.tsx`, `GoalTargetDateField.tsx`, `GoalTargetDateSheet.tsx`, `PurposeIconPickerSheet.tsx`, `PurposeIconSlot.tsx`

### 상세 섹션 (GoalDetailSections)
- `GoalProgressSection.tsx`, `GoalInfoSection.tsx`, `GoalLifecycleSection.tsx`, `LinkedRecordsSection.tsx`, `UnlinkedRecordsSection.tsx`

### 훅 (app/hooks/goal)
- data: `useGoals.ts`, `useGoalCreate.ts`, `useGoalUpdate.ts`, `useGoalDelete.ts`(미사용), `useGoalGroups.ts`, `useInvestmentGoalLink.ts`
- calculations: `useGoalProgress.ts` (`useGoalProgress`/`useGoalsProgress`)
- detail: `useGoalDetail.ts`
- add: `useGoalForm.ts`, `useGoalFlow.ts`

### 타입/상수/유틸
- `app/types/goal.ts` (Goal, GoalCreateInput, GoalUpdateInput, GoalProgress)
- `app/constants/goal.ts` (PURPOSE_ICONS, resolvePurposeIcon, GOAL_PRESETS)
- `app/utils/goal-format.ts` (`fmt`, `dDayLabel`)
- `app/utils/goal-status.ts` (`deriveGoalStatus`, `isPendingSettlement`, `isMaturedAndUnsettled`, `detectMaturityMismatch`)
- `app/utils/savingsMaturity.ts` (`calculateSavingsMaturity`)
- `app/types/investment.ts:112` (`getStartDate`)

### 보조 컴포넌트/훅/모듈
- `app/components/Common/MaturityMismatchConfirmModal.tsx`
- `app/components/AddItemSections/ExitConfirmDialog.tsx`
- `app/hooks/navigation/useFlowBack.ts`
- `app/hooks/payment/usePaymentHistory.ts` (`PaymentHistoryMap`)
- `app/lib/analytics.ts` (`track`, `amountBucket`, `daysBetween`)

### DB
- `supabase/migrations/20260507120000_add_goals_and_link_records.sql` (goals 테이블·RLS, records.goal_id, scheduled_notifications.goal_id, `archive_goal` RPC)

### 설계 문서 참조 (코드 주석에 언급, 본 저장소 외부)
- `.omc/specs/deep-interview-goal-savings-mismatch.md` (적금 만기 미스매치/정산 대기 처리 설계)
