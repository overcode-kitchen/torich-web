'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAddInvestmentForm } from './useAddInvestmentForm'
import { useSavingsCashSubmit } from './useSavingsCashSubmit'
import { useAddItemFlow } from './useAddItemFlow'
import { useAddItemFormState } from './useAddItemFormState'
import { useAddItemEditInit } from './useAddItemEditInit'
import { useAddItemResetPolicy } from './useAddItemResetPolicy'
import { useAddItemActions } from './useAddItemActions'
import { useModalState } from '@/app/hooks/ui/useModalState'
import { useInvestmentDaysPicker } from '@/app/hooks/common/useInvestmentDaysPicker'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { detectMaturityMismatch, type MaturityMismatch } from '@/app/utils/goal-status'
import { getRecordType } from '@/app/types/investment'
import type { Goal } from '@/app/types/goal'
import type { RecordType } from '@/app/types/investment'

/**
 * /add 페이지의 상태/액션을 한 번에 wiring하는 page-level hook.
 * page.tsx가 composition only를 유지하도록 모든 hook 호출과 콜백을 여기로 모은다.
 */
export function useAddRecordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const goalId = searchParams.get('goalId') ?? undefined
  const editId = searchParams.get('editId')
  const initialField = searchParams.get('field')
  const isEditMode = !!editId

  const [exitDialogOpen, setExitDialogOpen] = useState<boolean>(false)
  // 신규 추가 모드에서 사용자가 선택한 record_type. 미선택은 null (페이지 진입 직후).
  const [draftRecordType, setDraftRecordType] = useState<RecordType | null>(null)

  const edit = useAddItemEditInit({ editId })

  // UI에 노출되는 값: 편집 모드는 initData에서 파생, 신규는 사용자 선택값 (null 가능)
  const recordType: RecordType | null = edit.initData
    ? getRecordType(edit.initData)
    : draftRecordType
  // 하위 hook은 항상 valid한 RecordType이 필요하므로 fallback 제공. 단,
  // submit/canAdvance는 recordType이 null이면 발화되지 않도록 별도로 가드한다.
  const effectiveRecordType: RecordType = recordType ?? 'investment'
  const setRecordType = useCallback((type: RecordType): void => {
    setDraftRecordType(type)
  }, [])

  const flow = useAddItemFlow({ editId, initialField })
  const formState = useAddItemFormState({ initData: edit.initData })

  const investmentForm = useAddInvestmentForm({
    goalId,
    mode: isEditMode ? 'edit' : 'create',
    recordId: isEditMode ? editId ?? undefined : undefined,
    initData: edit.initData,
  })

  const savingsCashSubmit = useSavingsCashSubmit({
    recordType: effectiveRecordType === 'cash' ? 'cash' : 'savings',
    title: formState.title,
    monthlyAmount: formState.monthlyAmount,
    investmentDays: formState.investmentDays,
    interestRate: formState.interestRate,
    maturityDate: formState.maturityDate,
    periodYears: formState.periodYears,
    goalId,
    mode: isEditMode ? 'edit' : 'create',
    recordId: isEditMode ? editId ?? undefined : undefined,
  })

  // 유형 변경 시 후속 필드/그룹 리셋 + 토스트
  useAddItemResetPolicy({
    recordType: effectiveRecordType,
    formState,
    flow,
    resetInvestmentSpecific: () => {
      investmentForm.setStockName('')
      investmentForm.setSelectedStock(null)
      investmentForm.setIsManualInput(false)
    },
    isEditMode,
  })

  const modals = useModalState()

  const investmentDaysPicker = useInvestmentDaysPicker({
    initialDays: investmentForm.investmentDays,
    onApply: (days) => {
      investmentForm.setInvestmentDays(days)
      modals.setIsDaysPickerOpen(false)
    },
  })
  const savingsCashDaysPicker = useInvestmentDaysPicker({
    initialDays: formState.investmentDays,
    onApply: (days) => {
      formState.setInvestmentDays(days)
      modals.setIsDaysPickerOpen(false)
    },
  })

  const { goBack: goBackToRoot } = useFlowBack({ rootPath: '/' })

  // 케이스 A 사전 안내 — 적금 신규/수정 시 묶인 목적의 종료일이 만기보다 빠른지 검사.
  // 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
  const { user } = useAuth()
  const { goals } = useGoals(user?.id)
  const { updateGoal } = useGoalUpdate(user?.id)
  const linkedGoal: Goal | null = useMemo(
    () => (goalId ? goals.find((g) => g.id === goalId) ?? null : null),
    [goalId, goals],
  )
  const [pendingMismatch, setPendingMismatch] = useState<MaturityMismatch | null>(null)

  const guardedOnSubmitSavingsCash = useCallback(async (): Promise<void> => {
    if (
      effectiveRecordType === 'savings' &&
      linkedGoal?.target_date &&
      formState.maturityDate
    ) {
      const m = detectMaturityMismatch(linkedGoal.target_date, [
        {
          title: formState.title.trim() || '예적금',
          maturity_date: formState.maturityDate,
        },
      ])
      if (m) {
        setPendingMismatch(m)
        return
      }
    }
    await savingsCashSubmit.handleSubmit()
  }, [
    effectiveRecordType,
    linkedGoal,
    formState.maturityDate,
    formState.title,
    savingsCashSubmit,
  ])

  const dismissMismatch = useCallback((): void => {
    setPendingMismatch(null)
  }, [])

  const proceedDespiteMismatch = useCallback(async (): Promise<void> => {
    setPendingMismatch(null)
    await savingsCashSubmit.handleSubmit()
  }, [savingsCashSubmit])

  const alignAndSubmit = useCallback(async (): Promise<void> => {
    setPendingMismatch(null)
    if (linkedGoal && formState.maturityDate) {
      try {
        await updateGoal(linkedGoal.id, { target_date: formState.maturityDate })
      } catch {
        // 목적 업데이트 실패 시에도 사용자가 의도한 적금 저장은 계속 진행
      }
    }
    await savingsCashSubmit.handleSubmit()
  }, [linkedGoal, formState.maturityDate, updateGoal, savingsCashSubmit])

  const isSubmitting = investmentForm.isSubmitting || savingsCashSubmit.isSubmitting
  const actions = useAddItemActions({
    recordType,
    flow,
    investmentForm,
    formState,
    onSubmitInvestment: investmentForm.handleSubmit,
    onSubmitSavingsCash: guardedOnSubmitSavingsCash,
    isSubmitting,
  })

  const isInvestment = effectiveRecordType === 'investment'

  const handleBack = useCallback((): void => {
    if (flow.isAtFirstGroup) {
      setExitDialogOpen(true)
      return
    }
    flow.goPrevGroup()
  }, [flow])

  const onSkip = goalId && !isEditMode
    ? () => router.replace('/')
    : undefined

  const daysPicker = isInvestment ? investmentDaysPicker : savingsCashDaysPicker

  return {
    goalId,
    isEditMode,
    recordType,
    effectiveRecordType,
    setRecordType,
    flow,
    formState,
    investmentForm,
    modals,
    daysPicker,
    actions,
    isSubmitting,
    handleBack,
    exitDialogOpen,
    setExitDialogOpen,
    goBackToRoot,
    onSkip,
    // 케이스 A 사전 확인 모달용
    pendingMismatch,
    linkedGoal,
    dismissMismatch,
    proceedDespiteMismatch,
    alignAndSubmit,
  }
}
