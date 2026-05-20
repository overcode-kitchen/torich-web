'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAddInvestmentForm } from '@/app/hooks/investment/add/useAddInvestmentForm'
import { useSavingsCashForm } from '@/app/hooks/investment/add/useSavingsCashForm'
import { useRecordTypeSelection } from '@/app/hooks/investment/add/useRecordTypeSelection'
import { useModalState } from '@/app/hooks/ui/useModalState'
import { useInvestmentDaysPicker } from '@/app/hooks/common/useInvestmentDaysPicker'
import AddInvestmentView from '@/app/components/AddInvestmentView'
import SavingsCashView from '@/app/components/SavingsCashView'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

function AddRecordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // 목적 만들기 흐름에서 넘어온 경우, 생성될 항목을 이 목적에 연결한다.
  const goalId = searchParams.get('goalId') ?? undefined

  const { recordType, setRecordType } = useRecordTypeSelection()
  const isInvestment = recordType === 'investment'

  // 투자 폼 (투자 유형에서만 사용, 훅 규칙상 항상 호출)
  const investmentForm = useAddInvestmentForm({ goalId })
  // 예적금·현금 폼 (투자 선택 시에도 호출되지만 미사용)
  const savingsCashForm = useSavingsCashForm({
    recordType: recordType === 'cash' ? 'cash' : 'savings',
    goalId,
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
    initialDays: savingsCashForm.investmentDays,
    onApply: (days) => {
      savingsCashForm.setInvestmentDays(days)
      modals.setIsDaysPickerOpen(false)
    },
  })

  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  if (isInvestment) {
    return (
      <AddInvestmentView
        recordType={recordType}
        onRecordTypeChange={setRecordType}
        form={investmentForm}
        modals={modals}
        daysPicker={investmentDaysPicker}
        onBack={goBack}
        onSkip={goalId ? () => router.replace('/') : undefined}
      />
    )
  }

  return (
    <SavingsCashView
      recordType={recordType === 'cash' ? 'cash' : 'savings'}
      onRecordTypeChange={setRecordType}
      form={savingsCashForm}
      modals={modals}
      daysPicker={savingsCashDaysPicker}
      onBack={goBack}
      onSkip={goalId ? () => router.replace('/') : undefined}
    />
  )
}

export default function AddRecordPage() {
  return (
    <Suspense fallback={null}>
      <AddRecordContent />
    </Suspense>
  )
}
