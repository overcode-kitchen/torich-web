'use client'

import { useCallback, useState } from 'react'
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
  /** 현금 목표 기간(년). 빈 문자열이면 habit(무기한 적립) */
  periodYears: string
  setPeriodYearsRaw: (value: string) => void
  handlePeriodYearsChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  adjustPeriodYears: (delta: number) => void
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
  const [periodYears, setPeriodYears] = useState<string>('')

  // 편집 진입 시 기존 값으로 폼을 채운다. 기준은 "레코드가 바뀌었는가"(id)다.
  //
  // 이전에는 이 작업을 useEffect([initData])에서 했는데, initData는 목록이 갱신될 때마다
  // 새 객체 참조로 다시 들어온다. 값이 그대로여도 참조만 바뀌면 effect가 또 돌아
  // 사용자가 입력하던 내용을 서버 값으로 덮어썼다.
  //
  // 렌더 도중 state를 맞추는 건 React가 권장하는 패턴이다. 커밋 전에 곧바로 재렌더되므로
  // effect처럼 화면이 한 번 깜빡였다가 바뀌지 않는다.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prefilledId, setPrefilledId] = useState<string | null>(null)
  if (initData && initData.id !== prefilledId) {
    setPrefilledId(initData.id)
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
    setPeriodYears(
      initData.period_years != null && initData.period_years > 0
        ? String(initData.period_years)
        : '',
    )
  }

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

  // 목표 기간(년): 정수만 허용. 빈 문자열 허용 (habit 모드 의미).
  const handlePeriodYearsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPeriodYears(e.target.value.replace(/[^0-9]/g, ''))
  }

  const adjustPeriodYears = (delta: number): void => {
    const current = parseInt(periodYears || '0', 10)
    const next = Math.max(0, current + delta)
    setPeriodYears(next === 0 ? '' : String(next))
  }

  // useEffect 의존성에서 안정적으로 참조되도록 useCallback으로 메모이즈.
  const resetAll = useCallback((): void => {
    setTitle('')
    setMonthlyAmount('')
    setInvestmentDays([])
    setInterestRate('')
    setMaturityDate('')
    setPeriodYears('')
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
    periodYears,
    setPeriodYearsRaw: setPeriodYears,
    handlePeriodYearsChange,
    adjustPeriodYears,
    resetAll,
  }
}
