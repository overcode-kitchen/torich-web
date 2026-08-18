import type { Goal, GoalProgress } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'
import type { PaymentHistoryMap } from '@/app/types/payment'
import type { PostponedPaymentsMap } from '@/app/hooks/payment/usePostponedPayments'
import { isRecordPostponedInMonth } from '@/app/utils/payment-completion'
import {
  addMonths,
  earliestFundingEnd,
  earliestStartMonth,
  firstDayOf,
  monthIndex,
  scheduledAmount,
  toYearMonth,
  unpaidAmount,
  type YearMonth,
} from '@/app/utils/scheduled-contribution'

/** 앞으로 이만큼(50년) 넣어도 목표에 닿지 않으면 도착 시점을 말하지 않는다 */
const MAX_FUTURE_MONTHS = 600
/** 밀린 회차를 거슬러 세는 상한(20년) */
const MAX_PAST_MONTHS = 240
/** 추가 적립액 안내 단위 — 만원 미만을 말하면 실행할 수 없는 숫자가 된다 */
const EXTRA_MONTHLY_UNIT = 10_000

export type ArrivalReason = 'on_track' | 'config_gap' | 'postponed' | 'period_end'

/** 도착 예정을 계산할 수 있는 목적 — 기한이 있다는 것이 타입에 드러난다 */
export type DatedGoal = Goal & { target_date: string }

export interface GoalArrival {
  goal: DatedGoal
  progress: GoalProgress
  /** 도착 예정 월의 1일. 월 적립이 없어 계산할 수 없으면 null */
  arrivalDate: Date | null
  /** 목표일보다 늦게 닿는지 (계산 불가도 늦음으로 본다) */
  isLate: boolean
  reason: ArrivalReason
  /** 지금 이 목적에 매달 들어가는 금액(원) */
  monthlyContribution: number
  /** 목표일까지 부족한 금액(원). 0이면 목표일에 채워진다 */
  shortfall: number
  /** ① 설정 불일치 — 목표일에 맞추려면 매달 더 넣어야 하는 금액(만원 단위 올림) */
  extraMonthly: number
  /** ② 지금까지 빠뜨린 회차 수 (미룬 회차 포함) */
  behindCount: number
  /** 그중 명시적으로 미룬 회차 수 — 문구를 '미룬'과 '밀린'으로 가른다 */
  postponedCount: number
  /** ③ 적립이 끊기는 시점(만기·정산). 목표일 전에 끊기지 않으면 null */
  fundingEndDate: Date | null
}

/** 지금부터 목표일까지 앞으로 들어올 예정 금액 (이번 달은 아직 체크 안 한 회차만) */
function sumFutureUntilTarget(
  records: Investment[],
  today: Date,
  targetDate: Date,
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
): number {
  const nowYm = toYearMonth(today)
  const span = monthIndex(toYearMonth(targetDate)) - monthIndex(nowYm)
  if (span < 0) return 0

  const window = { until: targetDate, ignoreEnd: false }
  let total = 0
  for (let i = 0; i <= span; i++) {
    const ym = addMonths(nowYm, i)
    for (const record of records) {
      total +=
        i === 0
          ? unpaidAmount(record, ym, completedPayments, retroactivePayments, window)
          : scheduledAmount(record, ym, window)
    }
  }
  return total
}

/** 한 번도 빠뜨리지 않았다고 가정한 목표일까지의 누적 (설정 자체가 목표에 닿는지 보는 값) */
function sumAssumedUntilTarget(
  records: Investment[],
  from: YearMonth,
  targetDate: Date,
  ignoreEnd: boolean,
): number {
  const span = monthIndex(toYearMonth(targetDate)) - monthIndex(from)
  if (span < 0) return 0

  const window = { until: targetDate, ignoreEnd }
  let total = 0
  for (let i = 0; i <= span; i++) {
    const ym = addMonths(from, i)
    for (const record of records) total += scheduledAmount(record, ym, window)
  }
  return total
}

/** 도착 예정 월 — 남은 금액이 채워지는 달까지 앞으로 한 달씩 쌓아본다 */
function simulateArrival(
  records: Investment[],
  remaining: number,
  today: Date,
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
): Date | null {
  const nowYm = toYearMonth(today)
  if (remaining <= 0) return firstDayOf(nowYm)

  const window = { until: null, ignoreEnd: false }
  let accumulated = 0
  for (let i = 0; i < MAX_FUTURE_MONTHS; i++) {
    const ym = addMonths(nowYm, i)
    for (const record of records) {
      accumulated +=
        i === 0
          ? unpaidAmount(record, ym, completedPayments, retroactivePayments, window)
          : scheduledAmount(record, ym, window)
    }
    if (accumulated >= remaining) return firstDayOf(ym)
  }
  return null
}

/** 지난달까지 예정됐는데 체크되지 않은 회차 수. 이번 달은 아직 진행 중이라 세지 않는다 */
function countBehind(
  records: Investment[],
  today: Date,
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  postponedPayments: PostponedPaymentsMap,
): { behindCount: number; postponedCount: number } {
  const start = earliestStartMonth(records)
  const lastMonth = addMonths(toYearMonth(today), -1)
  if (!start) return { behindCount: 0, postponedCount: 0 }

  const span = Math.min(monthIndex(lastMonth) - monthIndex(start), MAX_PAST_MONTHS)
  const window = { until: null, ignoreEnd: false }
  let behindCount = 0
  let postponedCount = 0

  for (let i = 0; i <= span; i++) {
    const ym = addMonths(lastMonth, -i)
    for (const record of records) {
      // 미룸은 record-월 단위(홈 체크리스트와 같은 기준) → 그 달은 1회로 세고 회차는 건너뛴다
      if (isRecordPostponedInMonth(postponedPayments, record.id, ym.year, ym.month)) {
        if (scheduledAmount(record, ym, window) > 0) {
          postponedCount++
          behindCount++
        }
        continue
      }
      const unpaid = unpaidAmount(record, ym, completedPayments, retroactivePayments, window)
      if (unpaid > 0 && record.monthly_amount > 0) {
        behindCount += Math.round(unpaid / record.monthly_amount)
      }
    }
  }
  return { behindCount, postponedCount }
}

/**
 * 한 목적의 도착 예정과 '늦음의 원인'.
 *
 * "2개월 늦음"은 대개 게을러서가 아니라 원인이 셋이고, 각각 사용자가 할 일이 다르다.
 * - ③ 적립 기간 종료: 만기·정산으로 목표일 전에 적립이 끊긴다 (이어가면 닿는다)
 * - ① 설정 불일치: 한 번도 빠뜨리지 않아도 설정 자체가 목표에 못 닿는다 (더 넣어야 닿는다)
 * - ② 미룸·체크 누락: 설정으론 닿는데 실제 누적이 뒤처졌다 (채우면 닿는다)
 *
 * 원인은 "이어가면 닿는가 → 설정으로 닿는가" 순으로 좁혀 판정한다. ③을 먼저 보는 이유는
 * 만기로 끊긴 경우에도 '설정 부족'으로 보여 "월 N원 더" 안내가 나가면 할 일이 어긋나기 때문이다.
 */
export function buildGoalArrival(
  goal: DatedGoal,
  progress: GoalProgress,
  linkedRecords: Investment[],
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  postponedPayments: PostponedPaymentsMap,
  today: Date = new Date(),
): GoalArrival {
  const targetDate = new Date(goal.target_date)
  const nowYm = toYearMonth(today)
  const targetYm = toYearMonth(targetDate)

  const remaining = Math.max(0, goal.target_amount - progress.currentValue)
  const arrivalDate = simulateArrival(
    linkedRecords,
    remaining,
    today,
    completedPayments,
    retroactivePayments,
  )

  // 지금 매달 들어가는 금액. 이번 달 예정이 없으면(다음 달 시작하는 기록) 다음 달 기준으로 읽는다
  const window = { until: null, ignoreEnd: false }
  const thisMonthPlan = linkedRecords.reduce(
    (sum, r) => sum + scheduledAmount(r, nowYm, window),
    0,
  )
  const monthlyContribution =
    thisMonthPlan > 0
      ? thisMonthPlan
      : linkedRecords.reduce((sum, r) => sum + scheduledAmount(r, addMonths(nowYm, 1), window), 0)

  const projectedByTarget =
    progress.currentValue +
    sumFutureUntilTarget(linkedRecords, today, targetDate, completedPayments, retroactivePayments)
  const shortfall = Math.max(0, goal.target_amount - projectedByTarget)
  const monthsLeft = Math.max(1, monthIndex(targetYm) - monthIndex(nowYm))
  const extraMonthly =
    shortfall > 0
      ? Math.ceil(shortfall / monthsLeft / EXTRA_MONTHLY_UNIT) * EXTRA_MONTHLY_UNIT
      : 0

  const startYm = earliestStartMonth(linkedRecords) ?? nowYm
  const assumed =
    goal.external_amount + sumAssumedUntilTarget(linkedRecords, startYm, targetDate, false)
  const uncapped =
    goal.external_amount + sumAssumedUntilTarget(linkedRecords, startYm, targetDate, true)

  const { behindCount, postponedCount } = countBehind(
    linkedRecords,
    today,
    completedPayments,
    retroactivePayments,
    postponedPayments,
  )
  const fundingEndDate = earliestFundingEnd(linkedRecords, targetDate)

  const isLate = arrivalDate === null || monthIndex(toYearMonth(arrivalDate)) > monthIndex(targetYm)
  let reason: ArrivalReason = 'on_track'
  if (isLate) {
    const setupReaches = assumed >= goal.target_amount
    if (!setupReaches && uncapped >= goal.target_amount && fundingEndDate) reason = 'period_end'
    else if (!setupReaches) reason = 'config_gap'
    else reason = behindCount > 0 ? 'postponed' : 'config_gap'
  }

  return {
    goal,
    progress,
    arrivalDate,
    isLate,
    reason,
    monthlyContribution,
    shortfall,
    extraMonthly,
    behindCount,
    postponedCount,
    fundingEndDate,
  }
}
