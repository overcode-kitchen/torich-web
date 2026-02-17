import { useMemo } from 'react'
import { Investment, getStartDate } from '@/app/types/investment'
import { getThisMonthStats } from '@/app/utils/stats'
import { calculateEndDate } from '@/app/utils/date'

export interface CashHoldItemVM {
  id: string
  title: string
  endDate: Date
  maturityValue: number
}

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

import { PaymentHistoryMap } from '@/app/hooks/usePaymentHistory'

interface UseStatsCalculationsProps {
  records: Investment[]
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  selectedYear: number
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
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R?: number) => number
}

export function useStatsCalculations({ records, activeRecords, completedPayments, selectedYear }: UseStatsCalculationsProps): UseStatsCalculationsReturn {
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

    // Matured Items Logic
    const maturedItems = records
      .filter((item) => item.period_years < selectedYear)
      .map((item): CashHoldItemVM => {
        const startDate = getStartDate(item)
        const endDate = calculateEndDate(startDate, item.period_years)
        const R = item.annual_rate ? item.annual_rate / 100 : 0.10

        const maturityValue = calculateSimulatedValue(
          item.monthly_amount,
          item.period_years,
          item.period_years,
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

  return {
    totalExpectedAsset,
    totalMonthlyPayment,
    hasMaturedInvestments,
    maturedItems,
    thisMonth,
    calculateFutureValue: calculateSimulatedValue,
  }
}
