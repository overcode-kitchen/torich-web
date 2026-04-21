import { sendGAEvent } from '@next/third-parties/google'
import { Capacitor } from '@capacitor/core'

type Platform = 'web' | 'ios' | 'android'

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
 * 실제 금액(원)을 GA에 안전하게 보낼 수 있는 구간 문자열로 변환합니다.
 * 실제 금액(PII)이 GA에 직접 전송되는 것을 방지합니다.
 *
 * @example
 *   amountBucket(350_000) // → '100k_500k'
 */
export function amountBucket(won: number): string {
  if (won < 100_000) return '<100k'
  if (won < 500_000) return '100k_500k'
  if (won < 1_000_000) return '500k_1m'
  if (won < 3_000_000) return '1m_3m'
  if (won < 10_000_000) return '3m_10m'
  return '>=10m'
}
