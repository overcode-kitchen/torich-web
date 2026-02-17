'use client'

import { useRouter } from 'next/navigation'
import { useAddInvestmentForm } from '@/app/hooks/useAddInvestmentForm'
import { useModalState } from '@/app/hooks/useModalState'
import { useInvestmentDaysPicker } from '@/app/hooks/useInvestmentDaysPicker'
import AddInvestmentView from '@/app/components/AddInvestmentView'

export default function AddInvestmentPage() {
  const router = useRouter()
  const form = useAddInvestmentForm()
  const modals = useModalState()
  const daysPicker = useInvestmentDaysPicker({
    initialDays: form.investmentDays,
    onApply: (days) => {
      form.setInvestmentDays(days)
      modals.setIsDaysPickerOpen(false)
    },
  })

  return (
    <AddInvestmentView
      form={form}
      modals={modals}
      daysPicker={daysPicker}
      onBack={() => router.back()}
    />
  )
}