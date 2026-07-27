'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../auth/useUserData'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { createClient } from '@/utils/supabase/client'
import { track, amountBucket } from '@/app/lib/analytics'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import { isPastDateString, periodYearsUntil } from '@/app/utils/date'
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
  /**
   * 목표 기간(년). 입력칸은 현금에만 있지만, 예적금도 편집 진입 시 기존 값이 실려 온다.
   * 빈 문자열이면 habit(무기한 적립).
   */
  periodYears?: string
  /** 목적 만들기 흐름에서 넘어온 경우 연결할 목적 ID */
  goalId?: string
  /** 선택된 종료 날짜(YYYY-MM-DD, 기본값=목적 마감일). 현금 항목을 이 날짜에 만기시킬 때 사용(예적금 제외). 비면 무기한. */
  goalEndDate?: string
  /**
   * 편집 진입 시점의 만기일. 이미 만기된 항목을 이름만 고쳐 저장하는 건 정상이므로,
   * 과거 만기일 차단은 "사용자가 새로 고른 날짜"에만 적용한다.
   */
  initialMaturityDate?: string
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
  initialMaturityDate,
  goalId,
  goalEndDate,
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
    // 지나간 만기일은 저장을 막는다. 단 이미 만기된 기존 항목을 그대로 두는 건 정상이므로,
    // 편집 진입 시점 값과 같으면 통과시킨다. (달력에서도 과거 날짜는 선택할 수 없다)
    if (
      recordType === 'savings' &&
      isPastDateString(maturityDate) &&
      maturityDate !== initialMaturityDate
    ) {
      toastError('만기일은 오늘 이후로 선택해주세요.')
      return
    }

    // 목표 기간은 유형과 무관하게 폼 값을 그대로 반영한다.
    // 예적금은 입력칸이 없지만 편집 진입 시 기존 period_years가 폼에 실려 있다.
    // 여기서 유형으로 걸러 null을 넣으면 이름만 고쳐도 기존 값이 지워지고,
    // isHabitMode()가 true로 뒤집혀 '적립형'으로 잘못 분류된다. (종료일은 maturity_date 우선이라 무사)
    const periodYearsNum = parseInt(periodYears ?? '', 10)
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
      // 목적에 연결된 '현금' 항목이고 종료 날짜(기본=목적 마감일, 변경 가능)가 있으면 그 날짜에 만기시킨다.
      // (예적금은 자체 만기일 피커/정합성 흐름을 쓰므로 제외한다.) 비웠으면 무기한 적립.
      const goalLinkedCash =
        recordType === 'cash' && !!goalId && !!goalEndDate
      const goalDeadlineOverride = goalLinkedCash
        ? {
            maturity_date: goalEndDate,
            period_years: periodYearsUntil(new Date(), new Date(goalEndDate!)),
          }
        : {}

      const supabase = createClient()
      const { data: inserted, error } = await supabase
        .from('records')
        .insert({
          user_id: userId,
          ...payload,
          notification_enabled: true,
          ...(goalId ? { goal_id: goalId } : {}),
          ...goalDeadlineOverride,
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
    initialMaturityDate,
    recordType,
    goalId,
    goalEndDate,
    mode,
    recordId,
    router,
    addInvestment,
    updateInvestment,
  ])

  return { handleSubmit, isSubmitting }
}
