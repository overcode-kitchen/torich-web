'use client'

import type { ChangeEvent } from 'react'

export interface UseAddInvestmentCalculationsReturn {
  handleAmountChange: (e: ChangeEvent<HTMLInputElement>) => void
  adjustAmount: (delta: number) => void
  handlePeriodChange: (e: ChangeEvent<HTMLInputElement>) => void
  adjustPeriod: (delta: number) => void
}

interface UseAddInvestmentCalculationsProps {
  monthlyAmount: string
  setMonthlyAmount: (amount: string) => void
  period: string
  setPeriod: (period: string) => void
}

export function useAddInvestmentCalculations({
  monthlyAmount,
  setMonthlyAmount,
  period,
  setPeriod,
}: UseAddInvestmentCalculationsProps): UseAddInvestmentCalculationsReturn {
  
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/[^0-9]/g, '')

    if (value === '') {
      setMonthlyAmount('')
      return
    }

    const formatted = parseInt(value).toLocaleString('ko-KR')
    setMonthlyAmount(formatted)
  }

  const adjustAmount = (delta: number): void => {
    const currentValue = monthlyAmount ? parseInt(monthlyAmount.replace(/,/g, '')) : 0
    const newValue = Math.max(0, currentValue + delta)

    if (newValue === 0) {
      setMonthlyAmount('')
    } else {
      setMonthlyAmount(newValue.toLocaleString('ko-KR'))
    }
  }

  const handlePeriodChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setPeriod(value)
  }

  const adjustPeriod = (delta: number): void => {
    const currentValue = period ? parseInt(period) : 0
    const newValue = Math.max(1, currentValue + delta)
    setPeriod(String(newValue))
  }

  return {
    handleAmountChange,
    adjustAmount,
    handlePeriodChange,
    adjustPeriod,
  }
}
