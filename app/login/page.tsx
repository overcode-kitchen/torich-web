'use client'

import { useRouter } from 'next/navigation'
import { useLoginAuth } from '@/app/hooks/auth/useLoginAuth'
import LoginView from '@/app/components/LoginSections/LoginView'

export default function LoginPage() {
  const router = useRouter()
  const { isLoading, handleGoogleLogin, handleTestLogin } = useLoginAuth()

  return (
    <LoginView
      isLoading={isLoading}
      onGoogleLogin={handleGoogleLogin}
      onTestLogin={handleTestLogin}
      onBack={() => router.back()}
      showTestLogin={process.env.NODE_ENV === 'development'}
    />
  )
}

