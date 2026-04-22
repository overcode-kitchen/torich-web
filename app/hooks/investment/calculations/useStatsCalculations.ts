import { useMemo } from 'react'
import { Investment, getStartDate, isHabitMode } from '@/app/types/investment'
import { getThisMonthStats } from '@/app/utils/stats'
import { calculateEndDate, getElapsedMonths } from '@/app/utils/date'

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

import { PaymentHistoryMap } from '../../payment/usePaymentHistory'

interface UseStatsCalculationsProps {
  records: Investment[]
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  selectedYear: number
}

export interface GoalStats {
  count: number
  averageProgress: number
  nextMaturityItem: { id: string; title: string; endDate: Date } | null
}

export interface HabitStats {
  count: number
  averageElapsedMonths: number
  totalPaidPrincipal: number
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

  // 목표형/적립형 분리 집계
  const goalStats = useMemo<GoalStats>(() => {
    const goalRecords = activeRecords.filter((r) => !isHabitMode(r))
    if (goalRecords.length === 0) {
      return { count: 0, averageProgress: 0, nextMaturityItem: null }
    }
    const progresses = goalRecords.map((r) => {
      const start = getStartDate(r)
      const elapsedMonths = Math.max(0, getElapsedMonths(start))
      const totalMonths = (r.period_years ?? 0) * 12
      if (totalMonths <= 0) return 0
      return Math.min(100, Math.round((elapsedMonths / totalMonths) * 100))
    })
    const averageProgress = Math.round(
      progresses.reduce((a, b) => a + b, 0) / goalRecords.length
    )
    const withEnd = goalRecords
      .map((r) => {
        const start = getStartDate(r)
        const end = calculateEndDate(start, r.period_years)
        return end ? { id: r.id, title: r.title, endDate: end } : null
      })
      .filter((v): v is { id: string; title: string; endDate: Date } => v !== null)
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    return {
      count: goalRecords.length,
      averageProgress,
      nextMaturityItem: withEnd[0] ?? null,
    }
  }, [activeRecords])

  const habitStats = useMemo<HabitStats>(() => {
    const habitRecords = activeRecords.filter((r) => isHabitMode(r))
    if (habitRecords.length === 0) {
      return { count: 0, averageElapsedMonths: 0, totalPaidPrincipal: 0 }
    }
    const elapsedList = habitRecords.map((r) => Math.max(0, getElapsedMonths(getStartDate(r))))
    const averageElapsedMonths = Math.round(
      elapsedList.reduce((a, b) => a + b, 0) / habitRecords.length
    )
    const totalPaidPrincipal = habitRecords.reduce((sum, r, i) => {
      return sum + r.monthly_amount * elapsedList[i]
    }, 0)
    return {
      count: habitRecords.length,
      averageElapsedMonths,
      totalPaidPrincipal,
    }
  }, [activeRecords])

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
