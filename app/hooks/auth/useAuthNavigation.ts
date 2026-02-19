'use client'

import { useRouter } from 'next/navigation'

export const useAuthNavigation = () => {
  const router = useRouter()
  
  const goBack = () => router.back()
  const goToLogin = () => router.push('/login')
  
  return { goBack, goToLogin }
}
