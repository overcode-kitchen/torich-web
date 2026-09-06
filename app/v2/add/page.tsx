'use client'

import { useRouter } from 'next/navigation'
import { useV2Sandbox } from '@/app/hooks/v2/useV2Sandbox'
import { useV2AddForm } from '@/app/hooks/v2/useV2AddForm'
import V2AddView from '@/app/components/V2Sections/V2AddView'

export default function V2AddPage() {
  const router = useRouter()
  const { plan, committed, addItem } = useV2Sandbox()
  const form = useV2AddForm(addItem, () => router.push('/v2'))

  return (
    <V2AddView
      name={form.name}
      amount={form.amount}
      plan={plan}
      remainingAfter={Math.max(0, plan - (committed + form.amount))}
      canSubmit={form.canSubmit}
      onNameChange={form.setName}
      onAmountChange={form.setAmount}
      onSubmit={form.submit}
      onBack={() => router.push('/v2')}
    />
  )
}
