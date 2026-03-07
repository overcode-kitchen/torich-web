'use client'

import { useRouter } from 'next/navigation'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

export const useAuthNavigation = () => {
  const router = useRouter()
  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  const goToLogin = () => router.push('/login')

  return { goBack, goToLogin }
}
