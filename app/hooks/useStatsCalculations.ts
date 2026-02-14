import { useMemo } from 'react'
import { Investment } from '@/app/types/investment'
import { getThisMonthStats } from '@/app/utils/stats'

const calculateSimulatedValue = (
  monthlyAmount: number,
  T: number,
  P: number,
  R: number = 0.10
): number => {
  const monthlyRate = R / 12
  if (T <= P) {
    const totalMonths = T * 12
    return monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  }
  const maturityMonths = P * 12
  return monthlyAmount * ((Math.pow(1 + monthlyRate, maturityMonths) - 1) / monthlyRate) * (1 + monthlyRate)
}

interface UseStatsCalculationsProps {
  records: Investment[]
  activeRecords: Investment[]
  selectedYear: number
}

export interface UseStatsCalculationsReturn {
  totalExpectedAsset: number
  totalMonthlyPayment: number
  hasMaturedInvestments: boolean
  thisMonth: {
    totalPayment: number
    completedPayment: number
    progress: number
    remainingPayment: number
  }
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R?: number) => number
}

export function useStatsCalculations({ records, activeRecords, selectedYear }: UseStatsCalculationsProps): UseStatsCalculationsReturn {
  const { totalExpectedAsset, totalMonthlyPayment, hasMaturedInvestments } = useMemo(() => {
    if (records.length === 0) {
      return { totalExpectedAsset: 0, totalMonthlyPayment: 0, hasMaturedInvestments: false }
    }
    const totalExpectedAsset = records.reduce((sum, record) => {
      const P = record.period_years
      const R = record.annual_rate ? record.annual_rate / 100 : 0.10
      return sum + calculateSimulatedValue(record.monthly_amount, selectedYear, P, R)
    }, 0)
    const totalMonthlyPayment = records.reduce((sum, record) => sum + record.monthly_amount, 0)
    const hasMaturedInvestments = records.some((r) => r.period_years < selectedYear)
    return { totalExpectedAsset, totalMonthlyPayment, hasMaturedInvestments }
  }, [records, selectedYear])

  const thisMonth = useMemo(() => getThisMonthStats(activeRecords), [activeRecords])

  return {
    totalExpectedAsset,
    totalMonthlyPayment,
    hasMaturedInvestments,
    thisMonth,
    calculateFutureValue: calculateSimulatedValue,
  }
}
