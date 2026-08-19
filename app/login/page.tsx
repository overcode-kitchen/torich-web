'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CircleNotch } from '@phosphor-icons/react'
import { useLoginAuth } from '@/app/hooks/auth/useLoginAuth'
import { useAuth } from '@/app/hooks/auth/useAuth'
import LoginView from '@/app/components/LoginSections/LoginView'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

export default function LoginPage() {
  const router = useRouter()
  // useAuth의 세션 상태를 함께 본다. useLoginAuth.isLoading은 '버튼 클릭 진행'일 뿐이라,
  // OAuth 복귀 직후 세션 교환 구간을 덮지 못한다. (다른 화면과 가드 방식 통일)
  const { user, isLoading: authLoading } = useAuth()
  const { isLoading, handleGoogleLogin, handleAppleLogin } = useLoginAuth()
  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  // 세션이 이미 있으면(OAuth 복귀 완료·재진입) 로그인 화면을 거치지 않고 즉시 메인으로 보낸다.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/')
    }
  }, [authLoading, user, router])

  // 세션 복원 중이거나 이미 로그인된 상태에서는 로그인 버튼 대신 로딩을 그린다.
  // 이렇게 해야 OAuth 복귀 직후 인앱 브라우저가 닫히며 이 화면이 드러나도 버튼이 깜빡이지 않는다.
  if (authLoading || user) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  return (
    <LoginView
      isLoading={isLoading}
      onGoogleLogin={handleGoogleLogin}
      onAppleLogin={handleAppleLogin}
      onBack={goBack}
    />
  )
}
