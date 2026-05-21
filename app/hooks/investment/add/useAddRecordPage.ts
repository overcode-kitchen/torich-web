'use client'

import { useCallback, useState } from 'react'
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
import { getRecordType } from '@/app/types/investment'
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
  // 신규 추가 모드에서 사용자가 선택한 record_type. 편집 모드에서는 initData에서 파생되어 무시됨.
  const [draftRecordType, setDraftRecordType] = useState<RecordType>('investment')

  const edit = useAddItemEditInit({ editId })

  // 편집 모드: initData에서 record_type 파생 (useEffect + setState 우회 → cascading render 회피)
  // 신규 모드: 사용자 선택값을 그대로 사용
  const recordType: RecordType = edit.initData
    ? getRecordType(edit.initData)
    : draftRecordType
  const setRecordType = useCallback((type: RecordType): void => {
    setDraftRecordType(type)
  }, [])

  const flow = useAddItemFlow({ recordType, editId, initialField })
  const formState = useAddItemFormState({ initData: edit.initData })

  const investmentForm = useAddInvestmentForm({
    goalId,
    mode: isEditMode ? 'edit' : 'create',
    recordId: isEditMode ? editId ?? undefined : undefined,
  })

  const savingsCashSubmit = useSavingsCashSubmit({
    recordType: recordType === 'cash' ? 'cash' : 'savings',
    title: formState.title,
    monthlyAmount: formState.monthlyAmount,
    investmentDays: formState.investmentDays,
    interestRate: formState.interestRate,
    maturityDate: formState.maturityDate,
    goalId,
    mode: isEditMode ? 'edit' : 'create',
    recordId: isEditMode ? editId ?? undefined : undefined,
  })

  // 유형 변경 시 후속 필드/그룹 리셋 + 토스트
  useAddItemResetPolicy({
    recordType,
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

  const isSubmitting = investmentForm.isSubmitting || savingsCashSubmit.isSubmitting
  const actions = useAddItemActions({
    recordType,
    flow,
    investmentForm,
    formState,
    onSubmitInvestment: investmentForm.handleSubmit,
    onSubmitSavingsCash: savingsCashSubmit.handleSubmit,
    isSubmitting,
  })

  const handleBack = useCallback((): void => {
    if (flow.isAtFirstField) {
      setExitDialogOpen(true)
      return
    }
    flow.goBack()
  }, [flow])

  const onSkip = goalId && !isEditMode
    ? () => router.replace('/')
    : undefined

  const isInvestment = recordType === 'investment'
  const daysPicker = isInvestment ? investmentDaysPicker : savingsCashDaysPicker

  return {
    goalId,
    isEditMode,
    recordType,
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
  }
}
