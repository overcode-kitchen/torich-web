import { useMemo } from 'react'
import { differenceInDays, startOfDay } from 'date-fns'
import { Investment, getStartDate, isHabitMode } from '@/app/types/investment'
import { getPaymentEventsForMonth, getThisMonthStats } from '@/app/utils/stats'
import { isPaymentCompleted } from '@/app/utils/payment-completion'
import { calculateEndDate, getElapsedMonths } from '@/app/utils/date'
import type { PaymentHistoryMap } from '../../payment/usePaymentHistory'

export interface CashHoldItemVM {
  id: string
  title: string
  endDate: Date
  maturityValue: number
}

/**
 * 시뮬레이션 계산 (목표형은 만기 P년 상한, 적립형은 T년 전체 구간)
 */
const calculateSimulatedValue = (
  monthlyAmount: number,
  T: number,
  P: number | null,
  R: number = 0.10
): number => {
  const monthlyRate = R / 12
  // 목표형: P년에서 납입 종료 (이후 현금 보관)
  // 적립형(P null/0): T년 동안 계속 납입
  const effectiveMaturity = P && P > 0 ? P : T
  const cap = T <= effectiveMaturity ? T : effectiveMaturity
  const totalMonths = cap * 12
  if (totalMonths <= 0) return 0
  if (monthlyRate === 0) return monthlyAmount * totalMonths
  return (
    monthlyAmount *
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
    (1 + monthlyRate)
  )
}

interface UseStatsCalculationsProps {
  records: Investment[]
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  selectedYear: number
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
  totalExpectedAsset: number
  totalMonthlyPayment: number
  hasMaturedInvestments: boolean
  maturedItems: CashHoldItemVM[]
  thisMonth: {
    totalPayment: number
    completedPayment: number
    progress: number
    remainingPayment: number
  }
  goalStats: GoalStats
  habitStats: HabitStats
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R?: number) => number
}

export function useStatsCalculations({
  records,
  activeRecords,
  completedPayments,
  selectedYear,
}: UseStatsCalculationsProps): UseStatsCalculationsReturn {
  const { totalExpectedAsset, totalMonthlyPayment, hasMaturedInvestments, maturedItems } = useMemo(() => {
    if (records.length === 0) {
      return { totalExpectedAsset: 0, totalMonthlyPayment: 0, hasMaturedInvestments: false, maturedItems: [] }
    }
    const totalExpectedAsset = records.reduce((sum, record) => {
      const P = record.period_years
      const R = record.annual_rate ? record.annual_rate / 100 : 0.10
      return sum + calculateSimulatedValue(record.monthly_amount, selectedYear, P, R)
    }, 0)
    const totalMonthlyPayment = records.reduce((sum, record) => sum + record.monthly_amount, 0)

    // 만기 처리(목표형만): 적립형은 만기 개념이 없음
    const maturedItems = records
      .filter((item) => item.period_years !== null && item.period_years !== undefined && item.period_years > 0 && item.period_years < selectedYear)
      .map((item): CashHoldItemVM => {
        const startDate = getStartDate(item)
        const endDate = calculateEndDate(startDate, item.period_years) ?? startDate
        const R = item.annual_rate ? item.annual_rate / 100 : 0.10

        const maturityValue = calculateSimulatedValue(
          item.monthly_amount,
          item.period_years!,
          item.period_years!,
          R
        )

        return {
          id: item.id,
          title: item.title,
          endDate,
          maturityValue,
        }
      })

    const hasMaturedInvestments = maturedItems.length > 0
    return { totalExpectedAsset, totalMonthlyPayment, hasMaturedInvestments, maturedItems }
  }, [records, selectedYear])

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
    totalExpectedAsset,
    totalMonthlyPayment,
    hasMaturedInvestments,
    maturedItems,
    thisMonth,
    goalStats,
    habitStats,
    calculateFutureValue: (m, T, P, R = 0.10) => calculateSimulatedValue(m, T, P, R),
  }
}
