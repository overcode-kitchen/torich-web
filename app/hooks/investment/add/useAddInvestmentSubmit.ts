'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../auth/useUserData'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { validateInvestmentForm, validateAndHandleError } from '@/app/utils/validation'
import { createClient } from '@/utils/supabase/client'
import { formatInvestmentData } from '@/app/utils/investment-formatter'
import { track, amountBucket } from '@/app/lib/analytics'
import type { InvestmentUnitType } from '@/app/types/investment'

export interface UseAddInvestmentSubmitProps {
  stockName: string
  monthlyAmount: string
  period: string
  /** 적립형(목표 기간 없음) 여부 */
  isHabitMode?: boolean
  startDate: Date
  investmentDays: number[]
  annualRate: number
  isManualInput: boolean
  originalSystemRate: number | null
  selectedStock: any
  market?: 'KR' | 'US'
  /** 매수 단위 모드 (디폴트 'amount') */
  unitType?: InvestmentUnitType
  /** 주수 모드 입력 값 */
  monthlyShares?: string
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
  isHabitMode,
  startDate,
  investmentDays,
  annualRate,
  isManualInput,
  originalSystemRate,
  selectedStock,
  market,
  unitType,
  monthlyShares,
}: UseAddInvestmentSubmitProps): UseAddInvestmentSubmitReturn {
  const router = useRouter()
  const { userId } = useUserData()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    const sharePrice = typeof selectedStock?.currentPrice === 'number' ? selectedStock.currentPrice : undefined

    // 유효성 검사
    const validation = validateInvestmentForm({
      stockName,
      monthlyAmount,
      period,
      isHabitMode,
      userId,
      investmentDays,
      unitType,
      monthlyShares,
      sharePrice,
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
        isHabitMode,
        startDate,
        investmentDays,
        annualRate,
        isManualInput,
        originalSystemRate,
        selectedStock,
        market,
        unitType,
        monthlyShares,
        sharePrice,
      })

      // Supabase에 데이터 저장 (개별 알림 기본값: 켜짐)
      const { data: inserted, error } = await supabase
        .from('records')
        .insert({
          user_id: userId!,
          ...formattedData,
          notification_enabled: true,
        })
        .select('id')
        .single()

      if (error || !inserted) {
        toastError(TOAST_MESSAGES.updateSaveFailed)
        return
      }

      track('investment_create_success', {
        amount_bucket: amountBucket(Number(monthlyAmount) || 0),
        cycle_type: investmentDays.length > 0 ? 'custom' : 'monthly',
        has_rate: annualRate > 0,
      })

      // 과거 시작일이면 상세 페이지에서 소급 안내 시트를 띄운다.
      // 기준: 시작일이 이번 달 1일보다 이전인 경우
      const today = new Date()
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const isPastStartDate = startDate < currentMonthStart

      router.refresh()
      if (isPastStartDate) {
        router.push(`/investment?id=${inserted.id}&retroHint=1`)
      } else {
        router.push('/')
      }
    } catch {
      toastError(TOAST_MESSAGES.updateSaveFailed)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    stockName,
    monthlyAmount,
    period,
    isHabitMode,
    startDate,
    investmentDays,
    annualRate,
    isManualInput,
    originalSystemRate,
    selectedStock,
    market,
    unitType,
    monthlyShares,
    userId,
    router,
  ])

  return {
    handleSubmit,
    isSubmitting,
    userId,
  }
}
