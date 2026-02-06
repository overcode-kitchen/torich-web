'use client'

import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type InputChangeEvent = ChangeEvent<HTMLInputElement>

export interface UseAddInvestmentFormReturn {
  stockName: string
  setStockName: (name: string) => void
  monthlyAmount: string
  period: string
  startDate: Date
  setStartDate: (date: Date) => void
  investmentDays: number[]
  setInvestmentDays: (days: number[]) => void

  isSubmitting: boolean
  setIsSubmitting: (submitting: boolean) => void
  userId: string | null

  handleAmountChange: (e: InputChangeEvent) => void
  adjustAmount: (delta: number) => void
  handlePeriodChange: (e: InputChangeEvent) => void
  adjustPeriod: (delta: number) => void
}

export function useAddInvestmentForm(): UseAddInvestmentFormReturn {
  const router = useRouter()

  const [stockName, setStockName] = useState<string>('')
  const [monthlyAmount, setMonthlyAmount] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>(() => new Date())
  const [investmentDays, setInvestmentDays] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect((): (() => void) => {
    const startTime: number = Date.now()
    return (): void => {
      const endTime: number = Date.now()
      const _timeSpent: number = Math.round((endTime - startTime) / 1000)
    }
  }, [])

  useEffect((): void => {
    const getUser = async (): Promise<void> => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserId(data.user.id)
      } else {
        router.push('/login')
      }
    }

    void getUser()
  }, [router])

  const handleAmountChange = (e: InputChangeEvent): void => {
    const value: string = e.target.value.replace(/[^0-9]/g, '')

    if (value === '') {
      setMonthlyAmount('')
      return
    }

    const formatted: string = parseInt(value).toLocaleString('ko-KR')
    setMonthlyAmount(formatted)
  }

  const adjustAmount = (delta: number): void => {
    const currentValue: number = monthlyAmount ? parseInt(monthlyAmount.replace(/,/g, '')) : 0
    const newValue: number = Math.max(0, currentValue + delta)

    if (newValue === 0) {
      setMonthlyAmount('')
    } else {
      setMonthlyAmount(newValue.toLocaleString('ko-KR'))
    }
  }

  const handlePeriodChange = (e: InputChangeEvent): void => {
    const value: string = e.target.value.replace(/[^0-9]/g, '')
    setPeriod(value)
  }

  const adjustPeriod = (delta: number): void => {
    const currentValue: number = period ? parseInt(period) : 0
    const newValue: number = Math.max(1, currentValue + delta)
    setPeriod(String(newValue))
  }

  return {
    stockName,
    setStockName,
    monthlyAmount,
    period,
    startDate,
    setStartDate,
    investmentDays,
    setInvestmentDays,
    isSubmitting,
    setIsSubmitting,
    userId,
    handleAmountChange,
    adjustAmount,
    handlePeriodChange,
    adjustPeriod,
  }
}
