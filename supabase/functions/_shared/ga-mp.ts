/// <reference path="../../../types/supabase-deno.d.ts" />

/**
 * Edge Function에서 GA4 Measurement Protocol로 이벤트를 직접 송신합니다.
 * 클라이언트 SDK가 동작할 수 없는 서버사이드 시점(푸시 발송 등)에 사용합니다.
 *
 * Supabase Edge Function 시크릿:
 *   supabase secrets set GA_MEASUREMENT_ID=G-XXXXXXXXX
 *   supabase secrets set GA_API_SECRET=<GA4 콘솔 발급 Measurement Protocol API secret>
 */

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input)
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface SendGAEventArgs {
  measurementId: string
  apiSecret: string
  rawUserId: string
  eventName: string
  params?: Record<string, string | number | boolean>
}

/**
 * GA4 이벤트 1건을 Measurement Protocol로 송신합니다.
 * - rawUserId(Supabase user.id)는 SHA-256으로 해시되어 user_id, client_id에 모두 사용됩니다.
 * - 모든 이벤트에 `platform: "server"`, `engagement_time_msec: "1"`이 자동 포함됩니다.
 * - 실패 시 throw하므로 호출 측이 try/catch로 안전 처리해야 합니다.
 */
export async function sendGAEvent({
  measurementId,
  apiSecret,
  rawUserId,
  eventName,
  params = {},
}: SendGAEventArgs): Promise<void> {
  const userHash = await sha256Hex(rawUserId)
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: userHash,
      user_id: userHash,
      events: [
        {
          name: eventName,
          params: { engagement_time_msec: '1', platform: 'server', ...params },
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`GA4 MP send failed: ${response.status}`)
  }
}
