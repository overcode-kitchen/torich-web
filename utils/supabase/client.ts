import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { capacitorAuthStorage } from '@/lib/auth/capacitor-auth-storage'

/** supabase-js와 동일한 storageKey 규칙 (URL hostname 기반) - PKCE verifier 키 일치 */
function getStorageKey(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname.split('.')[0] ?? 'auth'
  return `sb-${hostname}-auth-token`
}

/** Capacitor 환경이면 네이티브 스토리지 사용 (앱 로드 직후에도 동일 클라이언트 보장) */
function shouldUseNativeStorage(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  if (!cap) return false
  return cap.isNativePlatform?.() === true
}

let cachedNativeClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (typeof window !== 'undefined' && shouldUseNativeStorage()) {
    if (cachedNativeClient) return cachedNativeClient
    cachedNativeClient = createSupabaseClient(url, key, {
      auth: {
        flowType: 'pkce',
        storageKey: getStorageKey(url),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: capacitorAuthStorage,
      },
    })
    return cachedNativeClient
  }

  return createBrowserClient(url, key)
}