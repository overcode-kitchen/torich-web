'use client'

import { useCallback, useMemo } from 'react'
import type { RecordType } from '@/app/types/investment'
import type { UseAddItemFlowReturn } from './useAddItemFlow'
import type { UseAddItemFormStateReturn } from './useAddItemFormState'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

export interface UseAddItemActionsProps {
  recordType: RecordType
  flow: UseAddItemFlowReturn
  investmentForm: UseAddInvestmentFormReturn
  formState: UseAddItemFormStateReturn
  /** 투자 유형 최종 제출 */
  onSubmitInvestment: () => Promise<void>
  /** 예적금/현금 유형 최종 제출 */
  onSubmitSavingsCash: () => Promise<void>
  isSubmitting: boolean
}

export interface UseAddItemActionsReturn {
  /** "다음" 또는 "저장하기" */
  label: string
  /** 현재 활성 필드의 검증 통과 여부 (false면 버튼 비활성) */
  canAdvance: boolean
  /** 클릭 핸들러 — 다음 필드/그룹으로 이동하거나 최종 제출 */
  onAction: () => void
}

function parseAmount(raw: string): number {
  const n = parseInt(raw.replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

/**
 * 그룹/필드별 진행 버튼 라벨·활성 여부·핸들러를 계산하는 hook.
 * - 마지막 필드(GroupC 마지막)면 라벨이 "저장하기"가 되고 onAction이 submit을 호출
 * - 그 외에는 "다음"이며 onAction이 flow.goNext()를 호출
 */
export function useAddItemActions({
  recordType,
  flow,
  investmentForm,
  formState,
  onSubmitInvestment,
  onSubmitSavingsCash,
  isSubmitting,
}: UseAddItemActionsProps): UseAddItemActionsReturn {
  const activeField = flow.fieldsInCurrentGroup[flow.currentFieldIndex]
  const isInvestment = recordType === 'investment'

  const canAdvance = useMemo<boolean>(() => {
    if (flow.currentGroup === 'A') {
      if (activeField === 'market') return !!investmentForm.market
      if (activeField === 'stockName') return investmentForm.stockName.trim().length > 0
      if (activeField === 'title') return formState.title.trim().length > 0
      return true
    }
    if (flow.currentGroup === 'B') {
      if (activeField === 'monthlyAmount') {
        const v = isInvestment ? investmentForm.monthlyAmount : formState.monthlyAmount
        return parseAmount(v) > 0
      }
      if (activeField === 'period') {
        return investmentForm.isHabitMode || parseAmount(investmentForm.period) > 0
      }
      if (activeField === 'interestRate') return parseFloat(formState.interestRate) > 0
      if (activeField === 'maturityDate') return !!formState.maturityDate
      return true
    }
    if (activeField === 'startDate') return true
    if (activeField === 'investmentDays') {
      const days = isInvestment ? investmentForm.investmentDays : formState.investmentDays
      return days.length > 0
    }
    return true
  }, [
    flow.currentGroup,
    activeField,
    isInvestment,
    investmentForm.market,
    investmentForm.stockName,
    investmentForm.monthlyAmount,
    investmentForm.period,
    investmentForm.isHabitMode,
    investmentForm.investmentDays,
    formState.title,
    formState.monthlyAmount,
    formState.interestRate,
    formState.maturityDate,
    formState.investmentDays,
  ])

  const label = flow.isAtLastField ? '저장하기' : '다음'

  const onAction = useCallback((): void => {
    if (isSubmitting) return
    if (flow.isAtLastField) {
      if (isInvestment) void onSubmitInvestment()
      else void onSubmitSavingsCash()
      return
    }
    flow.goNext()
  }, [
    isSubmitting,
    flow,
    isInvestment,
    onSubmitInvestment,
    onSubmitSavingsCash,
  ])

  return { label, canAdvance, onAction }
}
