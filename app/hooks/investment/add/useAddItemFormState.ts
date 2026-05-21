'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Investment } from '@/app/types/investment'

export interface UseAddItemFormStateProps {
  /** 편집 모드에서 기존 record로 초기화. undefined면 빈 상태로 시작. */
  initData?: Investment | null
}

export interface UseAddItemFormStateReturn {
  title: string
  setTitle: (value: string) => void
  monthlyAmount: string
  setMonthlyAmountRaw: (value: string) => void
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  adjustAmount: (delta: number) => void
  investmentDays: number[]
  setInvestmentDays: (days: number[]) => void
  interestRate: string
  setInterestRateRaw: (value: string) => void
  handleInterestRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  maturityDate: string
  setMaturityDate: (value: string) => void
  /** 공통 필드를 모두 빈 상태로 리셋 (type 변경 시 사용) */
  resetAll: () => void
}

/**
 * 적립 항목 공통 필드(이름·금액·납입일·금리·만기일) state 관리 hook.
 * - 신규 추가: initData=undefined로 빈 상태 시작
 * - 편집: initData=Investment 객체로 초기화
 * - 투자 전용 state(stockName 등)는 useAddInvestmentForm 파사드에서 별도 관리
 */
export function useAddItemFormState({
  initData,
}: UseAddItemFormStateProps): UseAddItemFormStateReturn {
  const [title, setTitle] = useState<string>('')
  const [monthlyAmount, setMonthlyAmount] = useState<string>('')
  const [investmentDays, setInvestmentDays] = useState<number[]>([])
  const [interestRate, setInterestRate] = useState<string>('')
  const [maturityDate, setMaturityDate] = useState<string>('')

  // initData 변경 시 1회 초기화 (편집 모드 진입)
  useEffect(() => {
    if (!initData) return
    setTitle(initData.title ?? '')
    setMonthlyAmount(
      initData.monthly_amount
        ? Math.round(initData.monthly_amount / 10000).toLocaleString()
        : '',
    )
    setInvestmentDays(initData.investment_days ?? [])
    setInterestRate(
      initData.interest_rate != null ? String(initData.interest_rate) : '',
    )
    setMaturityDate(initData.maturity_date ?? '')
  }, [initData])

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

  // useEffect 의존성에서 안정적으로 참조되도록 useCallback으로 메모이즈.
  const resetAll = useCallback((): void => {
    setTitle('')
    setMonthlyAmount('')
    setInvestmentDays([])
    setInterestRate('')
    setMaturityDate('')
  }, [])

  return {
    title,
    setTitle,
    monthlyAmount,
    setMonthlyAmountRaw: setMonthlyAmount,
    handleAmountChange,
    adjustAmount,
    investmentDays,
    setInvestmentDays,
    interestRate,
    setInterestRateRaw: setInterestRate,
    handleInterestRateChange,
    maturityDate,
    setMaturityDate,
    resetAll,
  }
}
