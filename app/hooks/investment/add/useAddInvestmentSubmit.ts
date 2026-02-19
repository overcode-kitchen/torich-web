'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../auth/useUserData'
import { validateInvestmentForm, validateAndHandleError } from '@/app/utils/validation'
import { createClient } from '@/utils/supabase/client'
import { formatInvestmentData } from '@/app/utils/investment-formatter'

export interface UseAddInvestmentSubmitProps {
  stockName: string
  monthlyAmount: string
  period: string
  startDate: Date
  investmentDays: number[]
  annualRate: number
  isManualInput: boolean
  originalSystemRate: number | null
  selectedStock: any
}

export interface UseAddInvestmentSubmitReturn {
  handleSubmit: (e: React.FormEvent) => Promise<void>
  isSubmitting: boolean
  userId: string | null
}

export function useAddInvestmentSubmit({
  stockName,
  monthlyAmount,
  period,
  startDate,
  investmentDays,
  annualRate,
  isManualInput,
  originalSystemRate,
  selectedStock,
}: UseAddInvestmentSubmitProps): UseAddInvestmentSubmitReturn {
  const router = useRouter()
  const { userId } = useUserData()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    // 유효성 검사
    const validation = validateInvestmentForm({
      stockName,
      monthlyAmount,
      period,
      userId,
      investmentDays,
    })

    const isValid = validateAndHandleError(
      validation,
      (message) => alert(message),
      () => router.push('/login')
    )

    if (!isValid) return

    try {
      setIsSubmitting(true)

      const supabase = createClient()

      // 데이터 변환
      const formattedData = await formatInvestmentData({
        stockName,
        monthlyAmount,
        period,
        startDate,
        investmentDays,
        annualRate,
        isManualInput,
        originalSystemRate,
        selectedStock,
      })

      // Supabase에 데이터 저장
      const { error } = await supabase
        .from('records')
        .insert({
          user_id: userId,
          ...formattedData,
        })

      if (error) {
        console.error('저장 오류:', error)
        alert('저장에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // 성공 시 메인으로 이동
      router.refresh()
      router.push('/')
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    stockName,
    monthlyAmount,
    period,
    startDate,
    investmentDays,
    annualRate,
    isManualInput,
    originalSystemRate,
    selectedStock,
    userId,
    router,
  ])

  return {
    handleSubmit,
    isSubmitting,
    userId,
  }
}
