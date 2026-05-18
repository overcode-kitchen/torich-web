'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAddInvestmentForm } from '@/app/hooks/investment/add/useAddInvestmentForm'
import { useModalState } from '@/app/hooks/ui/useModalState'
import { useInvestmentDaysPicker } from '@/app/hooks/common/useInvestmentDaysPicker'
import AddInvestmentView from '@/app/components/AddInvestmentView'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

function AddInvestmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // 목적 만들기 흐름에서 넘어온 경우, 생성될 투자를 이 목적에 연결한다.
  const goalId = searchParams.get('goalId') ?? undefined
  const form = useAddInvestmentForm({ goalId })
  const modals = useModalState()
  const daysPicker = useInvestmentDaysPicker({
    initialDays: form.investmentDays,
    onApply: (days) => {
      form.setInvestmentDays(days)
      modals.setIsDaysPickerOpen(false)
    },
  })
  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  return (
    <AddInvestmentView
      form={form}
      modals={modals}
      daysPicker={daysPicker}
      onBack={goBack}
      onSkip={goalId ? () => router.replace('/') : undefined}
    />
  )
}

export default function AddInvestmentPage() {
  return (
    <Suspense fallback={null}>
      <AddInvestmentContent />
    </Suspense>
  )
}
