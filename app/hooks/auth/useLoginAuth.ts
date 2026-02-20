'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

const TEST_EMAIL = 'test@test.com'
const TEST_PASSWORD = 'password1234'

const AUTH_CALLBACK_DEEP_LINK = 'torich://auth/callback'

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!cap?.isNativePlatform?.()
}

export function useLoginAuth() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const supabase = createClient()
      const redirectTo = isCapacitorNative()
        ? AUTH_CALLBACK_DEEP_LINK
        : `${location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      })
      
      if (error) throw error
      
    } catch (error) {
      console.error('Login Error:', error)
      alert('로그인 에러가 발생했습니다. 콘솔을 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleTestLogin = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // 1. 로그인 시도
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      if (!signInError) {
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = `${window.location.origin}/`
        return
      }

      // 2. 실패 시 회원가입 (자동 로그인됨)
      const { error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      if (signUpError) throw signUpError

      await new Promise(resolve => setTimeout(resolve, 500))
      window.location.href = `${window.location.origin}/`

    } catch (error: any) {
      console.error('테스트 로그인 실패:', error)
      alert('테스트 계정 생성 실패: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    handleGoogleLogin,
    handleTestLogin,
  }
}
