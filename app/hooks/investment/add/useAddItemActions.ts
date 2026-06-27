'use client'

import { useCallback, useMemo } from 'react'
import type { RecordType } from '@/app/types/investment'
import type { UseAddItemFlowReturn } from './useAddItemFlow'
import type { UseAddItemFormStateReturn } from './useAddItemFormState'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

export interface UseAddItemActionsProps {
  /** 유형 미선택은 null. canAdvance가 false로 강제된다. */
  recordType: RecordType | null
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
  /** "다음으로" 또는 "저장하기" */
  label: string
  /** 현재 그룹의 필수 입력이 모두 충족됐는가 (false면 버튼 비활성) */
  canAdvance: boolean
  /** 클릭 핸들러 — 다음 그룹으로 이동 또는 최종 제출 */
  onAction: () => void
}

function parseAmount(raw: string): number {
  const n = parseInt(raw.replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

function isGroupAReady(
  recordType: RecordType,
  investmentForm: UseAddInvestmentFormReturn,
  formState: UseAddItemFormStateReturn,
): boolean {
  if (recordType === 'investment') return investmentForm.stockName.trim().length > 0
  return formState.title.trim().length > 0
}

function isGroupBReady(
  recordType: RecordType,
  investmentForm: UseAddInvestmentFormReturn,
  formState: UseAddItemFormStateReturn,
): boolean {
  if (recordType === 'investment') {
    const amountOk =
      investmentForm.unitType === 'shares'
        ? parseAmount(investmentForm.monthlyShares) > 0
        : parseAmount(investmentForm.monthlyAmount) > 0
    const periodOk =
      investmentForm.isHabitMode || parseAmount(investmentForm.period) > 0
    return amountOk && periodOk
  }
  if (recordType === 'savings') {
    return (
      parseAmount(formState.monthlyAmount) > 0 &&
      parseFloat(formState.interestRate) > 0 &&
      !!formState.maturityDate
    )
  }
  return parseAmount(formState.monthlyAmount) > 0
}

function isGroupCReady(
  recordType: RecordType,
  investmentForm: UseAddInvestmentFormReturn,
  formState: UseAddItemFormStateReturn,
): boolean {
  const days =
    recordType === 'investment' ? investmentForm.investmentDays : formState.investmentDays
  return days.length > 0
}

/**
 * 그룹 단위 진행 액션 hook.
 * - 현재 그룹의 모든 필수 필드 충족 시 canAdvance=true
 * - 마지막 그룹(C)이면 라벨 "저장하기" + 최종 제출 호출
 * - 그 외에는 라벨 "다음으로" + 다음 그룹으로 이동
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
  const canAdvance = useMemo<boolean>(() => {
    if (recordType === null) return false
    if (flow.currentGroup === 'A') return isGroupAReady(recordType, investmentForm, formState)
    if (flow.currentGroup === 'B') return isGroupBReady(recordType, investmentForm, formState)
    return isGroupCReady(recordType, investmentForm, formState)
  }, [flow.currentGroup, recordType, investmentForm, formState])

  const label = flow.isAtLastGroup ? '저장하기' : '다음으로'

  const onAction = useCallback((): void => {
    if (isSubmitting || recordType === null) return
    if (flow.isAtLastGroup) {
      if (recordType === 'investment') void onSubmitInvestment()
      else void onSubmitSavingsCash()
      return
    }
    flow.goNextGroup()
  }, [isSubmitting, flow, recordType, onSubmitInvestment, onSubmitSavingsCash])

  return { label, canAdvance, onAction }
}
