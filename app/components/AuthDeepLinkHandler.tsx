'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { isCapacitorNative } from '@/lib/auth/capacitor-native'

/** iOS 인앱 브라우저 OAuth 복귀 URL (useLoginAuth의 NATIVE_AUTH_CALLBACK과 동일) */
const AUTH_CALLBACK_PREFIX = 'torich://login-callback'
const STORAGE_KEY_HANDLED_LAUNCH_URL = 'torich_auth_launch_url_handled'

/** 이미 처리한 URL이면 스킵 (무한 리다이렉트 방지) */
function shouldSkipHandledUrl(url: string): boolean {
  if (typeof sessionStorage === 'undefined') return false
  try {
    const handled = sessionStorage.getItem(STORAGE_KEY_HANDLED_LAUNCH_URL)
    return handled === url
  } catch {
    return false
  }
}

function markUrlAsHandled(url: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_HANDLED_LAUNCH_URL, url)
  } catch {
    // ignore
  }
}

async function handleAuthCallbackUrl(
  url: string,
  options: { closeBrowser?: boolean } = {}
): Promise<boolean> {
  if (!url.startsWith(AUTH_CALLBACK_PREFIX)) return false

  if (shouldSkipHandledUrl(url)) return true
  markUrlAsHandled(url)

  const { closeBrowser = false } = options
  if (closeBrowser) {
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.close()
    } catch {
      // 인앱 브라우저가 이미 닫혀 있으면 무시 (No active window to close)
    }
  }

  const parsed = new URL(url)
  const code = parsed.searchParams.get('code')
  const error = parsed.searchParams.get('error')
  const errorDescription = parsed.searchParams.get('error_description')
  const next = parsed.searchParams.get('next') ?? '/'

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    window.location.href = `/login?error=${encodeURIComponent(errorDescription || error)}`
    return true
  }

  if (!code) return false

  const supabase = createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    console.error('Exchange error:', exchangeError)
    window.location.href = `/login?error=${encodeURIComponent(exchangeError.message)}`
    return true
  }

  window.location.href = next
  return true
}

export default function AuthDeepLinkHandler() {
  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null)

  useEffect(() => {
    if (!isCapacitorNative()) return

    let cancelled = false

    const setup = async () => {
      try {
        const { App } = await import('@capacitor/app')
        const handler = async (data: { url: string }) => {
          await handleAuthCallbackUrl(data.url, { closeBrowser: true })
        }

        const listener = await App.addListener('appUrlOpen', handler)
        if (cancelled) {
          await listener.remove()
          return
        }
        listenerRef.current = listener

        const launchUrl = await App.getLaunchUrl()
        if (launchUrl?.url && !cancelled) {
          await handleAuthCallbackUrl(launchUrl.url, { closeBrowser: false })
        }
      } catch (e) {
        console.warn('AuthDeepLinkHandler Capacitor App not available', e)
      }
    }

    setup()
    return () => {
      cancelled = true
      listenerRef.current?.remove().catch(() => {})
      listenerRef.current = null
    }
  }, [])

  return null
}
