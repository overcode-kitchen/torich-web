'use client'

import { useAuthNavigation } from '@/app/hooks/auth/useAuthNavigation'
import AuthErrorView from '@/app/components/AuthSections/AuthErrorView'

export default function AuthCodeErrorPage() {
  const { goBack, goToLogin } = useAuthNavigation()

  return (
    <AuthErrorView
      onGoBack={goBack}
      onGoToLogin={goToLogin}
    />
  )
}


