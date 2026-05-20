import { useMemo } from 'react'
import { differenceInDays, startOfDay } from 'date-fns'
import { Investment, getStartDate, isHabitMode } from '@/app/types/investment'
import { getPaymentEventsForMonth, getThisMonthStats } from '@/app/utils/stats'
import { isPaymentCompleted } from '@/app/utils/payment-completion'
import { calculateEndDate, getElapsedMonths } from '@/app/utils/date'
import type { PaymentHistoryMap } from '../../payment/usePaymentHistory'

interface UseStatsCalculationsProps {
  records: Investment[]
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
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
  /** 지금까지 모은 누적 납입 원금 (월 납입액 × 경과 개월 합산) */
  totalPaidPrincipal: number
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
}: UseStatsCalculationsProps): UseStatsCalculationsReturn {
  const { totalPaidPrincipal, totalMonthlyPayment } = useMemo(() => {
    if (records.length === 0) {
      return { totalPaidPrincipal: 0, totalMonthlyPayment: 0 }
    }
    const totalPaidPrincipal = records.reduce((sum, record) => {
      const elapsedMonths = Math.max(0, getElapsedMonths(getStartDate(record)))
      return sum + record.monthly_amount * elapsedMonths
    }, 0)
    const totalMonthlyPayment = records.reduce((sum, record) => sum + record.monthly_amount, 0)
    return { totalPaidPrincipal, totalMonthlyPayment }
  }, [records])

  const thisMonth = useMemo(() => getThisMonthStats(activeRecords, completedPayments), [activeRecords, completedPayments])

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
    const events = getPaymentEventsForMonth(habitRecords, now.getFullYear(), now.getMonth() + 1)
    let thisMonthCompletedCount = 0
    for (const e of events) {
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
      thisMonthTotalCount: events.length,
      longestHabitItem,
    }
  }, [activeRecords, completedPayments])

  return {
    totalPaidPrincipal,
    totalMonthlyPayment,
    thisMonth,
    goalStats,
    habitStats,
  }
}
