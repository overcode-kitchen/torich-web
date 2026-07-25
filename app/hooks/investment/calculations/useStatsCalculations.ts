import { useMemo } from 'react'
import { Investment, isHabitMode } from '@/app/types/investment'
import { getPaymentEventsForMonth, getThisMonthStats } from '@/app/utils/stats'
import { isPaymentCompleted, isRecordPostponedInMonth } from '@/app/utils/payment-completion'
import { getRecordRealizedPrincipal } from '@/app/utils/realized-principal'
import type { Goal } from '@/app/types/goal'
import type { PaymentHistoryMap, CapturedAmountsMap } from '../../payment/usePaymentHistory'
import type { PostponedPaymentsMap } from '../../payment/usePostponedPayments'

const EMPTY_CAPTURED: CapturedAmountsMap = new Map()

interface UseStatsCalculationsProps {
  records: Investment[]
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  retroactivePayments: PaymentHistoryMap
  /** 이번 달 미룸 처리된 회차 — 예정(분모)에서 제외 */
  postponedPayments: PostponedPaymentsMap
  /** 각 납입의 매수 시점 실제 금액(원). 실현 원금을 현재 금액이 아닌 매수 시점 금액으로 합산 */
  capturedAmounts?: CapturedAmountsMap
  /** 목적(Goal) 목록 — 직접 입력한 '이미 모은 돈'(external_amount) 합산용 */
  goals: Goal[]
}

/** 한 투자 항목의 이번 달 납입 상태. */
export type MonthPaymentStatus =
  | { kind: 'done' } // 이번 달 예정분을 모두 냄
  | { kind: 'due'; day: number } // 아직 예정일 전 (곧 낼 차례)
  | { kind: 'overdue'; day: number } // 예정일이 지났는데 안 냄
  | { kind: 'none' } // 이번 달 예정 없음(또는 미룸)

/** 투자 항목 하나의 상태 — 목표형·적립형 공통. */
export interface InvestmentItemStat {
  id: string
  title: string
  /** 이번 달 납입 상태 배지용 */
  monthStatus: MonthPaymentStatus
  /** 지금까지 납입 완료한 개월 수 (자동+소급을 월 단위로 합산). 실제 낸 기록 기준. */
  paidMonths: number
  /** 목표형: 만기까지 총 납입 개월 수(=회차). 적립형은 만기가 없어 null. */
  totalMonths: number | null
}

export interface GoalStats {
  count: number
  /** 이번 달 납입 예정이 있는 항목 수 */
  thisMonthDueCount: number
  /** 그중 이번 달 완료한 항목 수 */
  thisMonthDoneCount: number
  /** 항목별 상태 (급한 순: 미납 → 예정 → 완료 → 예정없음) */
  items: InvestmentItemStat[]
}

export interface HabitStats {
  count: number
  thisMonthDueCount: number
  thisMonthDoneCount: number
  items: InvestmentItemStat[]
}

const STATUS_ORDER: Record<MonthPaymentStatus['kind'], number> = {
  overdue: 0,
  due: 1,
  done: 2,
  none: 3,
}

/**
 * 자동(일 단위)·소급(월 단위) 납입을 월 단위로 합쳐 완료 개월 수를 센다.
 * 같은 달에 여러 번 낸 것은 1개월로, 소급(YYYY-MM-01)과도 스케일이 맞는다.
 */
function countPaidMonths(
  id: string,
  completed: PaymentHistoryMap,
  retro: PaymentHistoryMap,
): number {
  const months = new Set<string>()
  completed.get(id)?.forEach((d) => months.add(d.slice(0, 7)))
  retro.get(id)?.forEach((d) => months.add(d.slice(0, 7)))
  return months.size
}

/** 한 투자의 이번 달 납입 상태를 판정한다. */
function computeMonthStatus(
  record: Investment,
  year: number,
  month: number,
  todayDay: number,
  completed: PaymentHistoryMap,
  postponed: PostponedPaymentsMap,
): MonthPaymentStatus {
  // 미룬 회차는 이번 달 예정에서 제외 → 상태 없음으로 본다
  if (isRecordPostponedInMonth(postponed, record.id, year, month)) return { kind: 'none' }
  const events = getPaymentEventsForMonth([record], year, month)
  if (events.length === 0) return { kind: 'none' }
  const incomplete = events.filter(
    (e) => !isPaymentCompleted(completed, e.investmentId, e.year, e.month, e.day),
  )
  if (incomplete.length === 0) return { kind: 'done' }
  const earliestDay = Math.min(...incomplete.map((e) => e.day))
  return earliestDay < todayDay
    ? { kind: 'overdue', day: earliestDay }
    : { kind: 'due', day: earliestDay }
}

/** 활성 기록 → 이번 달 상태·누적 회차를 담은 항목 리스트. 급한 상태가 위로 오도록 정렬. */
function buildItemStats(
  records: Investment[],
  completed: PaymentHistoryMap,
  retro: PaymentHistoryMap,
  postponed: PostponedPaymentsMap,
): InvestmentItemStat[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const todayDay = now.getDate()
  return records
    .map((r) => ({
      id: r.id,
      title: r.title,
      monthStatus: computeMonthStatus(r, year, month, todayDay, completed, postponed),
      paidMonths: countPaidMonths(r.id, completed, retro),
      totalMonths: Math.round((r.period_years ?? 0) * 12) || null,
    }))
    .sort((a, b) => STATUS_ORDER[a.monthStatus.kind] - STATUS_ORDER[b.monthStatus.kind])
}

/** 항목 리스트에서 이번 달 "예정 있는 항목 중 완료한 항목" 집계. */
function summarizeItems(items: InvestmentItemStat[]) {
  const due = items.filter((it) => it.monthStatus.kind !== 'none')
  return {
    thisMonthDueCount: due.length,
    thisMonthDoneCount: due.filter((it) => it.monthStatus.kind === 'done').length,
  }
}

export interface UseStatsCalculationsReturn {
  /** 지금까지 모은 돈 = 실제 납입 원금 누적(payment_history 기준) + 목적에 직접 입력한 '이미 모은 돈'. 완료분 포함 */
  totalPaidPrincipal: number
  /** 현재 매달 납입 중인 금액 합 (진행 중 기록만; 기간 종료분 제외) */
  totalMonthlyPayment: number
  thisMonth: {
    totalPayment: number
    completedPayment: number
    progress: number
    remainingPayment: number
  }
  goalStats: GoalStats
  habitStats: HabitStats
}

export function useStatsCalculations({
  records,
  activeRecords,
  completedPayments,
  retroactivePayments,
  postponedPayments,
  capturedAmounts = EMPTY_CAPTURED,
  goals,
}: UseStatsCalculationsProps): UseStatsCalculationsReturn {
  const { totalPaidPrincipal, totalMonthlyPayment } = useMemo(() => {
    // "지금까지 모은 돈" = 앱에 기록된 전체 모은 돈.
    // = 실제 납입한 원금(payment_history 기준, 예정치 아님) + 목적에 직접 입력한 '이미 모은 돈'(external_amount).
    // 각 납입은 매수 시점 실제 금액(captured)으로 합산 → 금액 수정해도 과거가 소급 변동하지 않음.
    // 목적 진척 currentValue(= external + 실현 납입)와 같은 기준으로 맞춰 카드 간 금액이 모순되지 않게 한다.
    const realizedPrincipal = records.reduce(
      (sum, record) =>
        sum +
        getRecordRealizedPrincipal(record, completedPayments, retroactivePayments, capturedAmounts),
      0,
    )
    const externalTotal = goals.reduce((sum, g) => sum + (g.external_amount ?? 0), 0)
    // "월 N씩 적립 중"·"이번 달 투자 내역" = 지금 매달 넣고 있는 금액.
    // 기간이 끝난(완료) 기록은 더 이상 납입하지 않으므로 activeRecords만 합산한다.
    // (totalPaidPrincipal은 완료분까지 누적하는 게 맞아 records 전체를 쓰는 것과 대비된다)
    const totalMonthlyPayment = activeRecords.reduce((sum, record) => sum + record.monthly_amount, 0)
    return { totalPaidPrincipal: realizedPrincipal + externalTotal, totalMonthlyPayment }
  }, [records, activeRecords, completedPayments, retroactivePayments, capturedAmounts, goals])

  const thisMonth = useMemo(() => getThisMonthStats(activeRecords, completedPayments, postponedPayments), [activeRecords, completedPayments, postponedPayments])

  // 목표형/적립형을 항목별로 분리 — 각 항목에 이번 달 납입 상태 + 누적 회차를 담는다.
  const goalStats = useMemo<GoalStats>(() => {
    const goalRecords = activeRecords.filter((r) => !isHabitMode(r))
    const items = buildItemStats(goalRecords, completedPayments, retroactivePayments, postponedPayments)
    return { count: goalRecords.length, ...summarizeItems(items), items }
  }, [activeRecords, completedPayments, retroactivePayments, postponedPayments])

  const habitStats = useMemo<HabitStats>(() => {
    const habitRecords = activeRecords.filter((r) => isHabitMode(r))
    const items = buildItemStats(habitRecords, completedPayments, retroactivePayments, postponedPayments)
    return { count: habitRecords.length, ...summarizeItems(items), items }
  }, [activeRecords, completedPayments, retroactivePayments, postponedPayments])

  return {
    totalPaidPrincipal,
    totalMonthlyPayment,
    thisMonth,
    goalStats,
    habitStats,
  }
}
