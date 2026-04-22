'use client'

import { useState } from 'react'
import { Investment, isHabitMode } from '@/app/types/investment'

interface UseInvestmentDetailEditReturn {
  // 폼 값
  editMonthlyAmount: string
  setEditMonthlyAmount: (value: string) => void
  editPeriodYears: string
  setEditPeriodYears: (value: string) => void
  editAnnualRate: string
  setEditAnnualRate: (value: string) => void
  editInvestmentDays: number[]
  setEditInvestmentDays: (days: number[] | ((prev: number[]) => number[])) => void

  // 적립형 모드 (목표 기간 없음)
  editIsHabitMode: boolean
  setEditIsHabitMode: (habit: boolean) => void

  // 수정 상태
  isRateManuallyEdited: boolean
  setIsRateManuallyEdited: (edited: boolean) => void

  // 핸들러
  handleNumericInput: (value: string, setter: (v: string) => void) => void
  handleRateInput: (value: string) => void

  // 초기화 (수정 모드 진입 시 호출)
  initializeFromItem: (item: Investment) => void
}

export function useInvestmentDetailEdit(): UseInvestmentDetailEditReturn {
  const [editMonthlyAmount, setEditMonthlyAmount] = useState('')
  const [editPeriodYears, setEditPeriodYears] = useState('')
  const [editAnnualRate, setEditAnnualRate] = useState('')
  const [editInvestmentDays, setEditInvestmentDays] = useState<number[]>([])
  const [editIsHabitMode, setEditIsHabitMode] = useState(false)
  const [isRateManuallyEdited, setIsRateManuallyEdited] = useState(false)

  const handleNumericInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    setter(cleaned)
  }

  const handleRateInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    setEditAnnualRate(cleaned)
    setIsRateManuallyEdited(true)
  }

  const initializeFromItem = (item: Investment) => {
    const habit = isHabitMode(item)
    setEditMonthlyAmount((item.monthly_amount / 10000).toString())
    setEditPeriodYears(habit ? '' : String(item.period_years))
    setEditAnnualRate((item.annual_rate || 10).toString())
    setEditInvestmentDays(item.investment_days || [])
    setEditIsHabitMode(habit)
    setIsRateManuallyEdited(false)
  }

  return {
    editMonthlyAmount,
    setEditMonthlyAmount,
    editPeriodYears,
    setEditPeriodYears,
    editAnnualRate,
    setEditAnnualRate,
    editInvestmentDays,
    setEditInvestmentDays,

    editIsHabitMode,
    setEditIsHabitMode,

    isRateManuallyEdited,
    setIsRateManuallyEdited,

    handleNumericInput,
    handleRateInput,

    initializeFromItem,
  }
}
