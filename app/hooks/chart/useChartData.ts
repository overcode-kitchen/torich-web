import { useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { Investment } from '@/app/types/investment'
import {
  getMonthlyCompletionRates,
  getMonthlyCompletionRatesForRange,
} from '@/app/utils/stats'
import { PaymentHistoryMap } from '../payment/usePaymentHistory'

interface UseChartDataProps {
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  isCustomRange: boolean
  effectiveMonths: number
  customDateRange?: DateRange
}

export interface UseChartDataReturn {
  monthlyRates: { monthLabel: string; rate: number; completed: number; total: number }[]
  periodCompletionRate: number
  chartData: { name: string; rate: number; completed: number; total: number }[]
  chartBarColor: string
}

export function useChartData({
  activeRecords,
  completedPayments,
  isCustomRange,
  effectiveMonths,
  customDateRange
}: UseChartDataProps): UseChartDataReturn {
  const monthlyRates = useMemo(() => {
    if (isCustomRange && customDateRange?.from && customDateRange?.to) {
      return getMonthlyCompletionRatesForRange(activeRecords, completedPayments, customDateRange.from, customDateRange.to)
    }
    return getMonthlyCompletionRates(activeRecords, completedPayments, effectiveMonths)
  }, [activeRecords, completedPayments, effectiveMonths, isCustomRange, customDateRange])

  const periodCompletionRate = useMemo(() => {
    const rates = monthlyRates
    if (rates.length === 0) return 0
    const totalEvents = rates.reduce((s, r) => s + r.total, 0)
    const totalCompleted = rates.reduce((s, r) => s + r.completed, 0)
    return totalEvents > 0 ? Math.round((totalCompleted / totalEvents) * 100) : 0
  }, [monthlyRates])

  const chartData = useMemo(() => {
    return [...monthlyRates].reverse().map((r) => ({
      name: r.monthLabel,
      rate: r.rate,
      completed: r.completed,
      total: r.total,
    }))
  }, [monthlyRates])

  const chartBarColor = useMemo(() => {
    if (typeof window === 'undefined') {
      // 서버 사이드 렌더링 시에는 대략적인 coolgray 색상으로 fallback
      return '#9c9ea6'
    }
    const root = getComputedStyle(document.documentElement)
    const fromToken = root.getPropertyValue('--foreground-soft').trim()
    return fromToken || '#9c9ea6'
  }, [])

  return {
    monthlyRates,
    periodCompletionRate,
    chartData,
    chartBarColor,
  }
}
