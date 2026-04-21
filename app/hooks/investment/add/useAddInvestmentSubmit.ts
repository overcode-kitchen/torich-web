'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../auth/useUserData'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { validateInvestmentForm, validateAndHandleError } from '@/app/utils/validation'
import { createClient } from '@/utils/supabase/client'
import { formatInvestmentData } from '@/app/utils/investment-formatter'
import { track, amountBucket } from '@/app/lib/analytics'

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
  market?: 'KR' | 'US'
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
  market,
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
        market,
      })

      // Supabase에 데이터 저장 (개별 알림 기본값: 켜짐)
      const { error } = await supabase
        .from('records')
        .insert({
          user_id: userId,
          ...formattedData,
          notification_enabled: true,
        })

      if (error) {
        toastError(TOAST_MESSAGES.updateSaveFailed)
        return
      }

      track('investment_create_success', {
        amount_bucket: amountBucket(Number(monthlyAmount) || 0),
        cycle_type: investmentDays.length > 0 ? 'custom' : 'monthly',
        has_rate: annualRate > 0,
      })

      // 성공 시 메인으로 이동
      router.refresh()
      router.push('/')
    } catch {
      toastError(TOAST_MESSAGES.updateSaveFailed)
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
    market,
    userId,
    router,
  ])

  return {
    handleSubmit,
    isSubmitting,
    userId,
  }
}
