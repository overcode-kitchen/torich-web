'use client'

import { useState } from 'react'
import type { SearchResult } from '../../stock/useStockSearch'

export interface UseAddInvestmentUIReturn {
  // 기본 폼 상태
  stockName: string
  setStockName: (name: string) => void
  monthlyAmount: string
  setMonthlyAmount: (amount: string) => void
  period: string
  setPeriod: (period: string) => void
  startDate: Date
  setStartDate: (date: Date) => void
  investmentDays: number[]
  setInvestmentDays: (days: number[]) => void

  // 마켓 변경 처리
  handleMarketChange: (newMarket: 'KR' | 'US') => void
}

interface UseAddInvestmentUIProps {
  stockSearch: {
    market: 'KR' | 'US'
    setMarket: (market: 'KR' | 'US') => void
    resetSearch: () => void
  }
  manualInput: {
    setIsManualInput: (manual: boolean) => void
  }
  rateEditor: {
    cancelEdit: () => void
  }
}

export function useAddInvestmentUI({
  stockSearch,
  manualInput,
  rateEditor,
}: UseAddInvestmentUIProps): UseAddInvestmentUIReturn {
  // 기본 폼 상태
  const [stockName, setStockName] = useState<string>('')
  const [monthlyAmount, setMonthlyAmount] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>(() => new Date())
  const [investmentDays, setInvestmentDays] = useState<number[]>([])

  // 마켓 변경 처리
  const handleMarketChange = (newMarket: 'KR' | 'US'): void => {
    if (stockSearch.market !== newMarket) {
      stockSearch.setMarket(newMarket)
      setStockName('')
      stockSearch.resetSearch()
      manualInput.setIsManualInput(false)
      rateEditor.cancelEdit()
    }
  }

  return {
    stockName,
    setStockName,
    monthlyAmount,
    setMonthlyAmount,
    period,
    setPeriod,
    startDate,
    setStartDate,
    investmentDays,
    setInvestmentDays,
    handleMarketChange,
  }
}
