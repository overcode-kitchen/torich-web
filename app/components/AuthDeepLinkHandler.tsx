'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

const AUTH_CALLBACK_SCHEME = 'torich://auth/callback'

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!cap?.isNativePlatform?.()
}

async function handleAuthCallbackUrl(url: string): Promise<boolean> {
  if (!url.startsWith(AUTH_CALLBACK_SCHEME)) return false
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
          await handleAuthCallbackUrl(data.url)
        }

        const listener = await App.addListener('appUrlOpen', handler)
        if (cancelled) {
          await listener.remove()
          return
        }
        listenerRef.current = listener

        const { url } = await App.getLaunchUrl()
        if (url && !cancelled) await handleAuthCallbackUrl(url)
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
