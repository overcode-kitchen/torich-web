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
import { setUserId } from '@/app/lib/analytics'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  isLoggingOut: boolean
  /** 앱 시작 시 세션 확인이 네트워크 에러/타임아웃으로 실패한 상태 (정상 로그아웃과 구분) */
  connectionError: boolean
  /** 연결 실패 후 세션 확인을 다시 시도 */
  retry: () => void
  logout: () => Promise<void>
}

/** getUser가 응답도 거부도 없이 매달리는 경우(오프라인 등)를 연결 실패로 전환하기 위한 타임아웃 */
const AUTH_INIT_TIMEOUT_MS = 8000

class AuthInitTimeoutError extends Error {
  constructor() {
    super('Auth init timed out')
    this.name = 'AuthInitTimeoutError'
  }
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
  const [connectionError, setConnectionError] = useState(false)
  // retry() 호출 시 init effect를 재실행시키기 위한 카운터
  const [retryTick, setRetryTick] = useState(0)

  const retry = useCallback((): void => {
    setConnectionError(false)
    setIsLoading(true)
    setRetryTick((t) => t + 1)
  }, [])

  useEffect((): (() => void) => {
    let isMounted = true

    const init = async (): Promise<void> => {
      try {
        // getUser가 응답/거부 없이 매달리는 오프라인 케이스를 연결 실패로 전환
        const result = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new AuthInitTimeoutError()), AUTH_INIT_TIMEOUT_MS),
          ),
        ])
        if (!isMounted) return

        const { data, error } = result

        if (error) {
          // 세션 없음 = 정상 로그아웃 (네트워크 문제 아님)
          if (isMissingAuthSession(error)) {
            setUser(null)
            return
          }
          // 그 외 에러는 연결 실패로 간주해 재시도 화면을 띄운다
          setConnectionError(true)
          return
        }
        setUser(data.user)
      } catch {
        // getUser throw(네트워크 실패) 또는 타임아웃 → 연결 실패
        if (isMounted) setConnectionError(true)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void init()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setConnectionError(false)
      setIsLoading(false)
    })

    return (): void => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase, retryTick])

  useEffect(() => {
    setUserId(user?.id)
  }, [user?.id])

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
      connectionError,
      retry,
      logout,
    }),
    [user, isLoading, isLoggingOut, connectionError, retry, logout],
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
