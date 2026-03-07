'use client'

import { useLoginAuth } from '@/app/hooks/auth/useLoginAuth'
import LoginView from '@/app/components/LoginSections/LoginView'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

export default function LoginPage() {
  const { isLoading, handleGoogleLogin, handleAppleLogin, handleTestLogin } = useLoginAuth()
  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  return (
    <LoginView
      isLoading={isLoading}
      onGoogleLogin={handleGoogleLogin}
      onAppleLogin={handleAppleLogin}
      onTestLogin={handleTestLogin}
      onBack={goBack}
      showTestLogin={process.env.NODE_ENV === 'development'}
    />
  )
}

