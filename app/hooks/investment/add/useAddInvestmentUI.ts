'use client'

import { useState } from 'react'
import type { SearchResult } from '../../stock/useStockSearch'
import type { InvestmentUnitType } from '@/app/types/investment'

export interface UseAddInvestmentUIReturn {
  // 기본 폼 상태
  stockName: string
  setStockName: (name: string) => void
  monthlyAmount: string
  setMonthlyAmount: (amount: string) => void
  period: string
  setPeriod: (period: string) => void
  isHabitMode: boolean
  setIsHabitMode: (habit: boolean) => void
  startDate: Date
  setStartDate: (date: Date) => void
  investmentDays: number[]
  setInvestmentDays: (days: number[]) => void

  // 매수 단위(금액/주수) 관련
  unitType: InvestmentUnitType
  setUnitType: (unit: InvestmentUnitType) => void
  monthlyShares: string
  handleSharesChange: (value: string) => void

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
  const [isHabitMode, setIsHabitMode] = useState<boolean>(false)
  const [startDate, setStartDate] = useState<Date>(() => new Date())
  const [investmentDays, setInvestmentDays] = useState<number[]>([])

  // 매수 단위 (금액/주수)
  const [unitType, setUnitType] = useState<InvestmentUnitType>('amount')
  const [monthlyShares, setMonthlyShares] = useState<string>('')

  // 정수만 허용 (소수점·기호 차단)
  const handleSharesChange = (value: string): void => {
    const digitsOnly = value.replace(/[^0-9]/g, '')
    setMonthlyShares(digitsOnly)
  }

  // 마켓 변경 처리. 미국 마켓으로 가면 주수 모드 해제 (1단계는 한국 전용)
  const handleMarketChange = (newMarket: 'KR' | 'US'): void => {
    if (stockSearch.market !== newMarket) {
      stockSearch.setMarket(newMarket)
      setStockName('')
      stockSearch.resetSearch()
      manualInput.setIsManualInput(false)
      rateEditor.cancelEdit()
      setUnitType('amount')
      setMonthlyShares('')
    }
  }

  return {
    stockName,
    setStockName,
    monthlyAmount,
    setMonthlyAmount,
    period,
    setPeriod,
    isHabitMode,
    setIsHabitMode,
    startDate,
    setStartDate,
    investmentDays,
    setInvestmentDays,
    unitType,
    setUnitType,
    monthlyShares,
    handleSharesChange,
    handleMarketChange,
  }
}
