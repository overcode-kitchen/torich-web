import { useMemo } from 'react'
import { differenceInDays, startOfDay } from 'date-fns'
import { Investment, getStartDate, isHabitMode } from '@/app/types/investment'
import { getPaymentEventsForMonth, getThisMonthStats } from '@/app/utils/stats'
import { isPaymentCompleted, isRecordPostponedInMonth } from '@/app/utils/payment-completion'
import { calculateEndDate, getElapsedMonths } from '@/app/utils/date'
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

export interface GoalStats {
  count: number
  /** 가장 이른 만기 (일정 기준 D-day 포함) */
  nextMaturityItem: { id: string; title: string; endDate: Date; daysLeft: number } | null
  /** 시간 대비 진행률이 가장 낮은 목표형 투자 */
  lowestProgressItem: { id: string; title: string; progressPercent: number } | null
}

export interface HabitStats {
  count: number
  /** 적립형만: 이번 달 예정 납입 건 중 완료 건수 */
  thisMonthCompletedCount: number
  /** 적립형만: 이번 달 예정 납입 총 건수 */
  thisMonthTotalCount: number
  /** 납입 경과 개월이 가장 긴 적립형 투자 */
  longestHabitItem: { id: string; title: string; elapsedMonths: number } | null
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

  // 목표형/적립형 분리 집계 (Health Check용)
  const goalStats = useMemo<GoalStats>(() => {
    const goalRecords = activeRecords.filter((r) => !isHabitMode(r))
    if (goalRecords.length === 0) {
      return { count: 0, nextMaturityItem: null, lowestProgressItem: null }
    }

    const today = startOfDay(new Date())

    let lowestProgressItem: GoalStats['lowestProgressItem'] = null
    for (const r of goalRecords) {
      const start = getStartDate(r)
      const elapsedMonths = Math.max(0, getElapsedMonths(start))
      const totalMonths = (r.period_years ?? 0) * 12
      const progressPercent =
        totalMonths <= 0 ? 0 : Math.min(100, Math.round((elapsedMonths / totalMonths) * 100))
      const candidate = { id: r.id, title: r.title, progressPercent }
      if (
        !lowestProgressItem ||
        candidate.progressPercent < lowestProgressItem.progressPercent ||
        (candidate.progressPercent === lowestProgressItem.progressPercent &&
          candidate.title < lowestProgressItem.title)
      ) {
        lowestProgressItem = candidate
      }
    }

    const withEnd = goalRecords
      .map((r) => {
        const start = getStartDate(r)
        const end = calculateEndDate(start, r.period_years)
        return end ? { id: r.id, title: r.title, endDate: end } : null
      })
      .filter((v): v is { id: string; title: string; endDate: Date } => v !== null)
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())

    const first = withEnd[0] ?? null
    const nextMaturityItem = first
      ? {
          id: first.id,
          title: first.title,
          endDate: first.endDate,
          daysLeft: differenceInDays(startOfDay(first.endDate), today),
        }
      : null

    return {
      count: goalRecords.length,
      nextMaturityItem,
      lowestProgressItem,
    }
  }, [activeRecords])

  const habitStats = useMemo<HabitStats>(() => {
    const habitRecords = activeRecords.filter((r) => isHabitMode(r))
    if (habitRecords.length === 0) {
      return {
        count: 0,
        thisMonthCompletedCount: 0,
        thisMonthTotalCount: 0,
        longestHabitItem: null,
      }
    }

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const events = getPaymentEventsForMonth(habitRecords, year, month)
    let thisMonthTotalCount = 0
    let thisMonthCompletedCount = 0
    for (const e of events) {
      // 미룬 회차는 이번 달 예정(분모)에서 제외
      if (isRecordPostponedInMonth(postponedPayments, e.investmentId, year, month)) continue
      thisMonthTotalCount++
      if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
        thisMonthCompletedCount++
      }
    }

    let longestHabitItem: HabitStats['longestHabitItem'] = null
    for (const r of habitRecords) {
      const elapsedMonths = Math.max(0, getElapsedMonths(getStartDate(r)))
      const candidate = { id: r.id, title: r.title, elapsedMonths }
      if (
        !longestHabitItem ||
        candidate.elapsedMonths > longestHabitItem.elapsedMonths ||
        (candidate.elapsedMonths === longestHabitItem.elapsedMonths &&
          candidate.title < longestHabitItem.title)
      ) {
        longestHabitItem = candidate
      }
    }

    return {
      count: habitRecords.length,
      thisMonthCompletedCount,
      thisMonthTotalCount,
      longestHabitItem,
    }
  }, [activeRecords, completedPayments, postponedPayments])

  return {
    totalPaidPrincipal,
    totalMonthlyPayment,
    thisMonth,
    goalStats,
    habitStats,
  }
}
