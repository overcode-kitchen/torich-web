'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../auth/useUserData'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { createClient } from '@/utils/supabase/client'
import { track, amountBucket } from '@/app/lib/analytics'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import type { Investment, RecordType } from '@/app/types/investment'

export interface UseSavingsCashSubmitProps {
  /** 'savings' | 'cash' (투자 유형은 이 훅을 쓰지 않음) */
  recordType: Exclude<RecordType, 'investment'>
  /** 항목 이름 */
  title: string
  /** 매달 금액 (만원 단위, 콤마 포함 문자열) */
  monthlyAmount: string
  /** 납입일 (1~31) */
  investmentDays: number[]
  /** 약정 연이율(%) — 예적금만 사용 */
  interestRate: string
  /** 만기일 (YYYY-MM-DD) — 예적금만 사용 */
  maturityDate: string
  /** 목표 기간(년) — 현금에서만 사용. 빈 문자열이면 habit(무기한 적립) */
  periodYears?: string
  /** 목적 만들기 흐름에서 넘어온 경우 연결할 목적 ID */
  goalId?: string
  /** 'create'(기본) | 'edit' — edit 모드면 recordId 필수 */
  mode?: 'create' | 'edit'
  /** edit 모드에서 수정할 records.id */
  recordId?: string
}

export interface UseSavingsCashSubmitReturn {
  handleSubmit: () => Promise<void>
  isSubmitting: boolean
}

/**
 * 예적금·현금 항목을 records 테이블에 저장하는 훅.
 * 투자 저장 경로(useAddInvestmentSubmit)와 분리되어 있다.
 */
export function useSavingsCashSubmit({
  recordType,
  title,
  monthlyAmount,
  investmentDays,
  interestRate,
  maturityDate,
  periodYears,
  goalId,
  mode = 'create',
  recordId,
}: UseSavingsCashSubmitProps): UseSavingsCashSubmitReturn {
  const router = useRouter()
  const { userId } = useUserData()
  const { addInvestment, updateInvestment } = useInvestmentsContext()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!userId) {
      router.push('/login')
      return
    }
    if (!title.trim()) {
      toastError('이름을 입력해주세요.')
      return
    }
    const amountInWon = parseInt(monthlyAmount.replace(/,/g, ''), 10) * 10000
    if (!Number.isFinite(amountInWon) || amountInWon <= 0) {
      toastError('매달 금액을 입력해주세요.')
      return
    }
    const rate = parseFloat(interestRate)
    if (recordType === 'savings' && (!Number.isFinite(rate) || rate <= 0)) {
      toastError('약정 연이율을 입력해주세요.')
      return
    }
    if (recordType === 'savings' && !maturityDate) {
      toastError('만기일을 선택해주세요.')
      return
    }

    // 현금만 목표 기간 입력 (예적금은 maturity_date로 종료 시점 관리)
    const periodYearsNum =
      recordType === 'cash' ? parseInt(periodYears ?? '', 10) : NaN
    const periodYearsValue =
      Number.isFinite(periodYearsNum) && periodYearsNum > 0 ? periodYearsNum : null

    const payload = {
      title: title.trim(),
      symbol: null,
      monthly_amount: amountInWon,
      period_years: periodYearsValue,
      annual_rate: 0,
      final_amount: 0,
      investment_days: investmentDays.length > 0 ? investmentDays : null,
      unit_type: 'amount',
      record_type: recordType,
      interest_rate: recordType === 'savings' ? rate : null,
      maturity_date: recordType === 'savings' ? maturityDate : null,
    }

    try {
      setIsSubmitting(true)

      // 편집 모드: updateInvestment에 위임(단일 진실 출처). 중복 .update() 방지.
      if (mode === 'edit' && recordId) {
        await updateInvestment(recordId, payload as Partial<Investment>)

        track('investment_update_success', {
          amount_bucket: amountBucket(amountInWon),
          cycle_type: investmentDays.length > 0 ? 'custom' : 'monthly',
          has_rate: recordType === 'savings',
        })

        router.push(`/investment?id=${recordId}`)
        return
      }

      // 신규 추가
      const supabase = createClient()
      const { data: inserted, error } = await supabase
        .from('records')
        .insert({
          user_id: userId,
          ...payload,
          notification_enabled: true,
          ...(goalId ? { goal_id: goalId } : {}),
        })
        .select('*')
        .single<Investment>()

      if (error || !inserted) {
        toastError(TOAST_MESSAGES.updateSaveFailed)
        return
      }

      addInvestment(inserted)
      track('investment_create_success', {
        amount_bucket: amountBucket(amountInWon),
        cycle_type: investmentDays.length > 0 ? 'custom' : 'monthly',
        has_rate: recordType === 'savings',
      })
      router.push('/')
    } catch {
      toastError(TOAST_MESSAGES.updateSaveFailed)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    userId,
    title,
    monthlyAmount,
    investmentDays,
    interestRate,
    maturityDate,
    periodYears,
    recordType,
    goalId,
    mode,
    recordId,
    router,
    addInvestment,
    updateInvestment,
  ])

  return { handleSubmit, isSubmitting }
}
