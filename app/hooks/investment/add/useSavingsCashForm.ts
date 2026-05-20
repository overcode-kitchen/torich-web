'use client'

import { useState } from 'react'
import { useSavingsCashSubmit } from './useSavingsCashSubmit'
import type { RecordType } from '@/app/types/investment'

export interface UseSavingsCashFormOptions {
  /** 'savings' | 'cash' */
  recordType: Exclude<RecordType, 'investment'>
  /** 목적 만들기 흐름에서 넘어온 경우 연결할 목적 ID */
  goalId?: string
}

export interface UseSavingsCashFormReturn {
  title: string
  setTitle: (value: string) => void
  monthlyAmount: string
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  adjustAmount: (delta: number) => void
  investmentDays: number[]
  setInvestmentDays: (days: number[]) => void
  interestRate: string
  handleInterestRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  maturityDate: string
  setMaturityDate: (value: string) => void
  isSubmitting: boolean
  handleSubmit: () => Promise<void>
}

/**
 * 예적금·현금 항목 추가 폼 상태 훅.
 * 공통 필드(이름·금액·납입일)와 예적금 전용 필드(금리·만기일)를 모두 보유한다.
 */
export function useSavingsCashForm({
  recordType,
  goalId,
}: UseSavingsCashFormOptions): UseSavingsCashFormReturn {
  const [title, setTitle] = useState<string>('')
  const [monthlyAmount, setMonthlyAmount] = useState<string>('')
  const [investmentDays, setInvestmentDays] = useState<number[]>([])
  const [interestRate, setInterestRate] = useState<string>('')
  const [maturityDate, setMaturityDate] = useState<string>('')

  // 금액: 숫자만 허용, 천 단위 콤마 표기 (만원 단위)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, '')
    if (digitsOnly === '') {
      setMonthlyAmount('')
      return
    }
    setMonthlyAmount(parseInt(digitsOnly, 10).toLocaleString())
  }

  const adjustAmount = (delta: number): void => {
    const current = parseInt(monthlyAmount.replace(/,/g, ''), 10) || 0
    const next = Math.max(0, current + delta)
    setMonthlyAmount(next === 0 ? '' : next.toLocaleString())
  }

  // 연이율: 숫자·소수점 1개만 허용
  const handleInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const cleaned = e.target.value.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    setInterestRate(parts.length > 2 ? `${parts[0]}.${parts[1]}` : cleaned)
  }

  const submit = useSavingsCashSubmit({
    recordType,
    title,
    monthlyAmount,
    investmentDays,
    interestRate,
    maturityDate,
    goalId,
  })

  return {
    title,
    setTitle,
    monthlyAmount,
    handleAmountChange,
    adjustAmount,
    investmentDays,
    setInvestmentDays,
    interestRate,
    handleInterestRateChange,
    maturityDate,
    setMaturityDate,
    isSubmitting: submit.isSubmitting,
    handleSubmit: submit.handleSubmit,
  }
}
