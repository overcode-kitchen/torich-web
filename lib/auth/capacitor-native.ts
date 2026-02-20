/**
 * Capacitor 네이티브 앱 여부 감지 (iOS/Android WebView)
 * - 웹 브라우저(Safari, Chrome 등)에서는 false
 * - 앱 내 WebView에서는 true
 */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as Window & { Capacitor?: CapacitorGlobal }).Capacitor
  if (!cap) return false
  if (typeof cap.isNativePlatform === 'function') return cap.isNativePlatform()
  const platform = typeof cap.getPlatform === 'function' ? cap.getPlatform() : ''
  return platform === 'ios' || platform === 'android'
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
}

const DIAGNOSTIC_TAG = '[Torich OAuth]'

export type OAuthDiagnostic = {
  redirectTo: string
  isNative: boolean
  platform: string
}

/**
 * OAuth 리다이렉트 진단 정보 반환 (화면 표시용)
 */
export function getAuthRedirectDiagnostics(redirectTo: string): OAuthDiagnostic {
  const isNative = isCapacitorNative()
  let platform = 'ssr'
  if (typeof window !== 'undefined') {
    const cap = (window as unknown as Window & { Capacitor?: CapacitorGlobal }).Capacitor
    platform = cap?.getPlatform?.() ?? 'unknown'
  }
  return { redirectTo, isNative, platform }
}

/**
 * OAuth 리다이렉트 진단 로그 (원인 파악용)
 * - 앱에서 구글 로그인 시 콘솔에 출력됨 (Safari Web Inspector로 앱 WebView 연결 후 확인)
 */
export function logAuthRedirectDiagnostics(redirectTo: string): void {
  const d = getAuthRedirectDiagnostics(redirectTo)
  console.log(`${DIAGNOSTIC_TAG} redirectTo=${d.redirectTo}, isNative=${d.isNative}, platform=${d.platform}`)
  if (!d.isNative && d.redirectTo.startsWith('http')) {
    console.warn(
      `${DIAGNOSTIC_TAG} 웹 환경으로 감지됨 → 웹 URL로 리다이렉트됩니다. 앱에서 테스트 중이라면 Capacitor가 로드되지 않았을 수 있습니다.`
    )
  }
}
