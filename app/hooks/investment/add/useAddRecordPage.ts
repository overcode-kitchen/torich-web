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
import { useUnsavedChangesGuard } from '@/app/hooks/navigation/useUnsavedChangesGuard'
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

  // 묶인 목적 정보 — 신규 추가 흐름에서 목적 마감일을 폼/저장 경로로 관통시키기 위해
  // 폼 훅 생성 이전에 계산한다. (edit 모드에는 적용하지 않는다.)
  const { user } = useAuth()
  const { goals } = useGoals(user?.id)
  const { updateGoal } = useGoalUpdate(user?.id)
  const linkedGoal: Goal | null = useMemo(
    () => (goalId ? goals.find((g) => g.id === goalId) ?? null : null),
    [goalId, goals],
  )
  // 신규 추가 + 목적 마감일이 있을 때만 "목적 마감일에 맞춰 모으기"를 적용한다.
  const goalDeadline: string | undefined = isEditMode
    ? undefined
    : linkedGoal?.target_date ?? undefined

  // 목적에 묶인 항목의 "종료 날짜". 기본값은 목적 마감일이고, 사용자가 바꾸면 그 값을 쓴다.
  // (빈 문자열이면 종료 없이 계속 적립 = 무기한). 분리(unlink)해도 이 날짜는 항목에 남는다.
  const [endDateOverride, setEndDateOverride] = useState<string | null>(null)
  const goalEndDate: string = endDateOverride ?? goalDeadline ?? ''
  const setGoalEndDate = useCallback((v: string) => setEndDateOverride(v), [])

  const investmentForm = useAddInvestmentForm({
    goalId,
    goalHasDeadline: !!goalDeadline,
    goalEndDate,
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
    initialMaturityDate: edit.initData?.maturity_date ?? undefined,
    goalId,
    goalEndDate,
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

  // 이탈 확인: 입력이 실제로 바뀐 경우에만 붙잡는다. (← 버튼·브라우저 뒤로가기 동일 규칙)
  // 편집 모드는 프리필이 끝난 뒤를 기준으로 삼아야 "안 고쳤는데 확인이 뜨는" 오판이 없다.
  const dirtySignature = useMemo(
    () =>
      JSON.stringify([
        recordType,
        formState.title,
        formState.monthlyAmount,
        formState.investmentDays,
        formState.interestRate,
        formState.maturityDate,
        formState.periodYears,
        investmentForm.stockName,
        investmentForm.monthlyAmount,
        investmentForm.monthlyShares,
        investmentForm.unitType,
        investmentForm.period,
        investmentForm.isHabitMode,
        investmentForm.startDate?.getTime() ?? null,
        investmentForm.investmentDays,
        endDateOverride,
      ]),
    [
      recordType,
      formState.title,
      formState.monthlyAmount,
      formState.investmentDays,
      formState.interestRate,
      formState.maturityDate,
      formState.periodYears,
      investmentForm.stockName,
      investmentForm.monthlyAmount,
      investmentForm.monthlyShares,
      investmentForm.unitType,
      investmentForm.period,
      investmentForm.isHabitMode,
      investmentForm.startDate,
      investmentForm.investmentDays,
      endDateOverride,
    ],
  )

  const guard = useUnsavedChangesGuard({
    signature: dirtySignature,
    ready: !isEditMode || !!edit.initData,
    deferBaseline: isEditMode,
    onExit: goBackToRoot,
  })
  const { runWithoutGuard } = guard

  // 케이스 A 사전 안내 — 적금 신규/수정 시 묶인 목적의 종료일이 만기보다 빠른지 검사.
  // 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
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
    // 저장은 스스로 화면을 옮기므로 감시 항목을 먼저 걷어내고 실행한다.
    onSubmitInvestment: () => runWithoutGuard(investmentForm.handleSubmit),
    onSubmitSavingsCash: () => runWithoutGuard(guardedOnSubmitSavingsCash),
    isSubmitting,
  })

  const isInvestment = effectiveRecordType === 'investment'

  const handleBack = useCallback((): void => {
    if (flow.isAtFirstGroup) {
      guard.requestExit()
      return
    }
    flow.goPrevGroup()
  }, [flow, guard])

  const onSkip = goalId && !isEditMode
    ? () => void runWithoutGuard(() => router.replace('/'))
    : undefined

  const daysPicker = isInvestment ? investmentDaysPicker : savingsCashDaysPicker

  return {
    goalId,
    isEditMode,
    recordType,
    effectiveRecordType,
    setRecordType,
    goalDeadline,
    goalEndDate,
    setGoalEndDate,
    flow,
    formState,
    investmentForm,
    modals,
    daysPicker,
    actions,
    isSubmitting,
    handleBack,
    exitDialogOpen: guard.isConfirmOpen,
    closeExitDialog: guard.cancelExit,
    confirmExit: guard.confirmExit,
    onSkip,
    // 케이스 A 사전 확인 모달용
    pendingMismatch,
    linkedGoal,
    dismissMismatch,
    proceedDespiteMismatch,
    alignAndSubmit,
  }
}
