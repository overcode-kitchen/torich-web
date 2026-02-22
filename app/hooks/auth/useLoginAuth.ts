'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { isCapacitorNative } from '@/lib/auth/capacitor-native'

const TEST_EMAIL = 'test@test.com'
const TEST_PASSWORD = 'password1234'

/** iOS/네이티브 앱: 인앱 브라우저 OAuth 후 앱 복귀용 딥링크 */
const NATIVE_AUTH_CALLBACK = 'torich://login-callback'

export function useLoginAuth() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      if (isCapacitorNative()) {
        try {
          sessionStorage.removeItem('torich_auth_launch_url_handled')
        } catch {
          // ignore
        }
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: NATIVE_AUTH_CALLBACK,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            skipBrowserRedirect: true,
          },
        })
        if (error) throw error
        if (data?.url) {
          await new Promise((r) => setTimeout(r, 300))
          const { Browser } = await import('@capacitor/browser')
          await Browser.open({ url: data.url })
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            skipBrowserRedirect: false,
          },
        })
        if (error) throw error
      }
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
