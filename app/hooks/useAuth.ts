'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { useFCMToken } from './useFCMToken'

type UseAuthOptions = {
  onLogout?: () => void | Promise<void>
}

type AuthErrorLike = {
  name?: string
  message?: string
}

const isMissingAuthSession = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const e = error as AuthErrorLike
  return e.name === 'AuthSessionMissingError' || e.message === 'Auth session missing!'
}

type UseAuthReturn = {
  user: User | null
  isLoading: boolean
  isLoggingOut: boolean
  logout: () => Promise<void>
}

export const useAuth = (options?: UseAuthOptions): UseAuthReturn => {
  const supabase = useMemo(() => createClient(), [])
  const { registerFCMToken } = useFCMToken()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  useEffect((): (() => void) => {
    let isMounted: boolean = true

    const init = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          if (!isMounted) return

          if (isMissingAuthSession(error)) {
            setUser(null)
            return
          }

          setUser(null)
          return
        }
        if (!isMounted) return
        setUser(data.user)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void init()

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setIsLoading(false)

      // 로그인 완료 시 FCM 토큰 등록
      if (event === 'SIGNED_IN' && session?.user) {
        void registerFCMToken(session.user)
      }
    })

    return (): void => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase, registerFCMToken])

  const logout = useCallback(async (): Promise<void> => {
    setIsLoggingOut(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      await options?.onLogout?.()
    } finally {
      setIsLoggingOut(false)
    }
  }, [options, supabase])

  return {
    user,
    isLoading,
    isLoggingOut,
    logout,
  }
}
