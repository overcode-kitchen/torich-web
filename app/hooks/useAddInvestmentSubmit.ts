'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from './useUserData'
import { validateInvestmentForm, validateAndHandleError } from '@/app/utils/validation'
import { createClient } from '@/utils/supabase/client'

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
      // 콤마 제거 후 숫자로 변환하고 만원 단위로 처리 (원 단위로 변환)
      const monthlyAmountInWon = parseInt(monthlyAmount.replace(/,/g, '')) * 10000
      const periodYearsNum = parseInt(period)
      
      // 최종 금액 계산을 위한 임포트
      const { calculateFinalAmount } = await import('@/app/utils/finance')
      const finalAmount = calculateFinalAmount(monthlyAmountInWon, periodYearsNum, annualRate)

      // is_custom_rate 판별: 직접 입력했거나, 시스템 값을 수정한 경우 true
      const isCustomRate = isManualInput || (originalSystemRate !== null && annualRate !== originalSystemRate)

      // symbol 결정: 검색을 통해 선택한 경우 selectedStock.symbol, 직접 입력은 null
      const stockSymbol = !isManualInput && selectedStock?.symbol ? selectedStock.symbol : null

      // Supabase에 데이터 저장
      const { error } = await supabase
        .from('records')
        .insert({
          user_id: userId,
          title: stockName.trim(),
          symbol: stockSymbol,
          monthly_amount: monthlyAmountInWon,
          period_years: periodYearsNum,
          annual_rate: annualRate,
          final_amount: finalAmount,
          start_date: startDate.toISOString().split('T')[0],
          investment_days: investmentDays.length > 0 ? investmentDays : null,
          is_custom_rate: isCustomRate,
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
