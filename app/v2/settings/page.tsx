'use client'

import { useRouter } from 'next/navigation'
import { useV2Sandbox } from '@/app/hooks/v2/useV2Sandbox'
import V2SettingsView from '@/app/components/V2Sections/V2SettingsView'

export default function V2SettingsPage() {
  const router = useRouter()
  const { startBalance, reset } = useV2Sandbox()

  return (
    <V2SettingsView
      startBalance={startBalance}
      onReset={() => {
        reset()
        router.replace('/v2/onboarding')
      }}
    />
  )
}
