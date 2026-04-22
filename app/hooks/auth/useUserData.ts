'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/auth/useAuth'

export interface UseUserDataReturn {
  userId: string | null
}

export function useUserData(): UseUserDataReturn {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  return {
    userId: user?.id ?? null,
  }
}
