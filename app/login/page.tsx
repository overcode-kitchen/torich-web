'use client'

import { useRouter } from 'next/navigation'
import { useLoginAuth } from '@/app/hooks/auth/useLoginAuth'
import LoginView from '@/app/components/LoginSections/LoginView'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

export default function LoginPage() {
  const router = useRouter()
  const { isLoading, handleGoogleLogin, handleTestLogin } = useLoginAuth()
  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  return (
    <LoginView
      isLoading={isLoading}
      onGoogleLogin={handleGoogleLogin}
      onTestLogin={handleTestLogin}
      onBack={goBack}
      showTestLogin={process.env.NODE_ENV === 'development'}
    />
  )
}

