'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  isLoggingOut: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
  /** 로그아웃 직후 추가 정리(예: 로컬 상태 초기화) */
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

export function AuthProvider({ children, onLogout }: AuthProviderProps) {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect((): (() => void) => {
    let isMounted = true

    const init = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!isMounted) return

        if (error) {
          if (isMissingAuthSession(error)) {
            setUser(null)
            return
          }
          setUser(null)
          return
        }
        setUser(data.user)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void init()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return (): void => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

  const logout = useCallback(async (): Promise<void> => {
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      await onLogout?.()
    } finally {
      setIsLoggingOut(false)
    }
  }, [supabase, onLogout])

  const value = useMemo(
    (): AuthContextValue => ({
      user,
      isLoading,
      isLoggingOut,
      logout,
    }),
    [user, isLoading, isLoggingOut, logout],
  )

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.')
  }
  return ctx
}
