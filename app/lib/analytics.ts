import { sendGAEvent } from '@next/third-parties/google'
import { Capacitor } from '@capacitor/core'
import sha256 from 'js-sha256'

type Platform = 'web' | 'ios' | 'android'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'
  const p = Capacitor.getPlatform?.()
  return p === 'ios' || p === 'android' ? p : 'web'
}

/**
 * GA4 이벤트를 전송하는 공통 함수.
 * 모든 이벤트에 platform 파라미터가 자동으로 포함됩니다.
 *
 * @example
 *   track('investment_create_success', { amount_bucket: '100k_500k' })
 */
export function track(
  event: string,
  params: Record<string, string | number | boolean> = {},
): void {
  try {
    sendGAEvent('event', event, { platform: getPlatform(), ...params })
  } catch {
    // 애널리틱스 오류가 앱 동작을 중단시키면 안 됩니다.
  }
}

/**
 * GA4에 user_id를 설정합니다. Supabase user.id를 SHA-256으로 해시한 값만 전송합니다.
 * iOS ITP/Capacitor 환경에서 동일 유저를 일관되게 추적하기 위함이며, 미설정 시
 * KPI 1(신규 유저)·KPI 3(월간 리텐션)이 부정확해집니다.
 */
export function setUserId(rawUserId: string | null | undefined): void {
  try {
    if (typeof window === 'undefined') return
    const gaId = process.env.NEXT_PUBLIC_GA_ID
    if (!gaId || !window.gtag || !rawUserId) return
    const hashed = (sha256 as unknown as (msg: string) => string)(rawUserId)
    window.gtag('config', gaId, { user_id: hashed })
  } catch {
    // ignore
  }
}

/**
 * 실제 금액(원)을 GA에 안전하게 보낼 수 있는 구간 문자열로 변환합니다.
 * 실제 금액(PII)이 GA에 직접 전송되는 것을 방지합니다.
 *
 * @example
 *   amountBucket(350_000) // → '300k_500k'
 */
export function amountBucket(won: number): string {
  if (won < 100_000) return '<100k'
  if (won < 300_000) return '100k_300k'
  if (won < 500_000) return '300k_500k'
  if (won < 1_000_000) return '500k_1m'
  if (won < 3_000_000) return '1m_3m'
  if (won < 10_000_000) return '3m_10m'
  return '>=10m'
}

/**
 * `YYYY-MM-DD` 날짜 문자열을 이번 달 기준 상대 월 오프셋으로 변환합니다.
 * 0=당월, -1=지난달, +1=다음달. 소급 납입 분포를 보기 위함.
 */
export function monthOffset(dateYMD: string): number {
  const [y, m] = dateYMD.split('-').map(Number)
  if (!y || !m) return 0
  const now = new Date()
  return (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth())
}

/** 일괄 완료 건수를 GA 안전 구간 문자열로 변환합니다. */
export function countBucket(n: number): string {
  if (n <= 3) return '1_3'
  if (n <= 6) return '4_6'
  if (n <= 12) return '7_12'
  return '>=13'
}

/**
 * 로그인 실패 사유를 GA `login_failure.reason` 파라미터용 라벨로 분류합니다.
 * - cancelled: 사용자가 취소 (Apple 1001, Google access_denied 등)
 * - network: 네트워크/타임아웃/fetch 실패
 * - denied: 권한 거부/forbidden
 * - unknown: 그 외 (분류 실패)
 */
export function classifyAuthFailure(
  error: unknown
): 'cancelled' | 'network' | 'denied' | 'unknown' {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''
  const msg = raw.toLowerCase()
  if (
    msg.includes('cancel') ||
    msg.includes('1001') ||
    msg.includes('access_denied') ||
    msg.includes('user denied')
  ) {
    return 'cancelled'
  }
  if (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('net::')
  ) {
    return 'network'
  }
  if (msg.includes('denied') || msg.includes('forbidden')) {
    return 'denied'
  }
  return 'unknown'
}
