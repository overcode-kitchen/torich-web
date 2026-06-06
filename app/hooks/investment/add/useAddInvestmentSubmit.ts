'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../auth/useUserData'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { validateInvestmentForm, validateAndHandleError } from '@/app/utils/validation'
import { createClient } from '@/utils/supabase/client'
import { formatInvestmentData } from '@/app/utils/investment-formatter'
import { track, amountBucket } from '@/app/lib/analytics'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import type { Investment, InvestmentUnitType } from '@/app/types/investment'
import type { StockDetail } from '@/app/hooks/types/useStockSearch'

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
  selectedStock: StockDetail | null
  market?: 'KR' | 'US'
  /** 매수 단위 모드 (디폴트 'amount') */
  unitType?: InvestmentUnitType
  /** 주수 모드 입력 값 */
  monthlyShares?: string
  /** 목적 만들기 흐름에서 넘어온 경우, 생성될 투자를 이 목적에 연결한다. */
  goalId?: string
  /** 'create'(기본) | 'edit' — edit 모드면 recordId 필수 */
  mode?: 'create' | 'edit'
  /** edit 모드에서 수정할 records.id */
  recordId?: string
}

export interface UseAddInvestmentSubmitReturn {
  handleSubmit: () => Promise<void>
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
  goalId,
  mode = 'create',
  recordId,
}: UseAddInvestmentSubmitProps): UseAddInvestmentSubmitReturn {
  const router = useRouter()
  const { userId } = useUserData()
  const { addInvestment, updateInvestment } = useInvestmentsContext()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = useCallback(async (): Promise<void> => {
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

      // 편집 모드: updateInvestment에 위임(단일 진실 출처). 중복 .update() 방지.
      if (mode === 'edit' && recordId) {
        await updateInvestment(recordId, formattedData as Partial<Investment>)

        track('investment_update_success', {
          amount_bucket: amountBucket(formattedData.monthly_amount),
          cycle_type: investmentDays.length > 0 ? 'custom' : 'monthly',
          has_rate: annualRate > 0,
        })

        router.push(`/investment?id=${recordId}`)
        return
      }

      // 신규 추가
      const supabase = createClient()
      const { data: inserted, error } = await supabase
        .from('records')
        .insert({
          user_id: userId!,
          ...formattedData,
          notification_enabled: true,
          ...(goalId ? { goal_id: goalId } : {}),
        })
        .select('*')
        .single<Investment>()

      if (error || !inserted) {
        toastError(TOAST_MESSAGES.updateSaveFailed)
        return
      }

      // 클라이언트 캐시(InvestmentsContext)에 즉시 반영 → 메인 복귀 시 stale 리스트가 그려졌다가 깜빡이는 현상 방지
      addInvestment(inserted)

      track('investment_create_success', {
        amount_bucket: amountBucket(formattedData.monthly_amount),
        cycle_type: investmentDays.length > 0 ? 'custom' : 'monthly',
        has_rate: annualRate > 0,
      })

      // 과거 시작일이면 상세 페이지에서 소급 안내 시트를 띄운다.
      const today = new Date()
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const isPastStartDate = startDate < currentMonthStart

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
    goalId,
    mode,
    recordId,
    userId,
    router,
    addInvestment,
    updateInvestment,
  ])

  return {
    handleSubmit,
    isSubmitting,
    userId,
  }
}
