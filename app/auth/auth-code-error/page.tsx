'use client'

import { useAuthNavigation } from '@/app/hooks/useAuthNavigation'
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


