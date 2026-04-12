'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/auth/useAuth'

export function useSettingsAuth() {
  const router = useRouter()
  const { user, isLoading, isLoggingOut, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [isLoading, user, router])

  const handleLogout = async () => {
    try {
      await logout()
      router.replace('/login')
      window.location.href = '/login'
    } catch (e) {
      console.error(e)
    }
  }

  return {
    user,
    isLoading,
    isLoggingOut,
    handleLogout,
  }
}
