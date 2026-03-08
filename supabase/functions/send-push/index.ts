// Supabase Edge Function: send-push
// pg_cron으로 1분마다 호출되어 scheduled_notifications의 pending 항목을 FCM으로 발송
/// <reference path="../../../types/supabase-deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getToken } from 'https://deno.land/x/google_jwt_sa@v0.2.5/mod.ts'

interface ScheduledNotification {
  id: string
  user_id: string
  record_id: string | null
  token: string
  title: string
  body: string
  scheduled_at: string
  status: string
}

interface FCMSendResult {
  ok: boolean
  invalidToken?: boolean
}

/** FCM 에러 응답에서 토큰 만료/무효 여부 판단 (NOT_FOUND/UNREGISTERED, INVALID_ARGUMENT) */
function isTokenInvalidFcmError(status: string | undefined, details: unknown): boolean {
  if (status === 'NOT_FOUND' || status === 'UNREGISTERED') return true
  if (status !== 'INVALID_ARGUMENT') return false
  const arr = Array.isArray(details) ? details : []
  for (const d of arr) {
    const code = (d as { errorCode?: string })?.errorCode
    if (code === 'UNREGISTERED' || code === 'INVALID_ARGUMENT') return true
  }
  return false
}

/**
 * Google OAuth2 access token 발급
 * google_jwt_sa 라이브러리를 사용하여 JWT 생성 및 토큰 교환
 */
async function getGoogleAccessToken(
  serviceAccountJson: string
): Promise<string> {
  try {
    const token = await getToken(serviceAccountJson, {
      scope: ['https://www.googleapis.com/auth/firebase.messaging'],
    })

    return token.access_token
  } catch (error) {
    throw new Error(`Failed to get access token: ${error}`)
  }
}

/**
 * FCM HTTP v1 API로 푸시 알림 발송.
 * 실패 시 응답 본문을 파싱해 토큰 만료/무효(UNREGISTERED, INVALID_ARGUMENT) 여부를 반환.
 */
async function sendFCMPush(
  projectId: string,
  accessToken: string,
  token: string,
  title: string,
  body: string
): Promise<FCMSendResult> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: token,
        notification: {
          title: title,
          body: body,
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`FCM send failed: ${errorText}`)

    let invalidToken = false
    try {
      const errJson = JSON.parse(errorText) as {
        error?: { status?: string; details?: unknown }
      }
      const status = errJson?.error?.status
      const details = errJson?.error?.details
      invalidToken = isTokenInvalidFcmError(status, details)
    } catch {
      // 파싱 실패 시 토큰 삭제하지 않음
    }

    return { ok: false, invalidToken }
  }

  return { ok: true }
}

Deno.serve(async (req) => {
  try {
    // 환경 변수 확인
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')
    const firebaseServiceAccountJson = Deno.env.get(
      'FIREBASE_SERVICE_ACCOUNT_JSON'
    )

    if (
      !supabaseUrl ||
      !supabaseServiceKey ||
      !firebaseProjectId ||
      !firebaseServiceAccountJson
    ) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Firebase Service Account JSON 유효성 검사
    try {
      JSON.parse(firebaseServiceAccountJson)
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid service account JSON' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Google OAuth2 access token 발급
    let accessToken: string
    try {
      accessToken = await getGoogleAccessToken(firebaseServiceAccountJson)
    } catch (error) {
      console.error('Failed to get Google access token:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to get access token' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 1. scheduled_notifications 조회 (발송 시각이 된 pending 항목)
    const { data: rawNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(100)
      .order('scheduled_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!rawNotifications || rawNotifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed_count: 0,
          message: 'No pending notifications to send',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. notification_enabled가 false인 record에 연결된 알림만 취소·제외 (record_id null/sentinel은 공지 등으로 그대로 발송)
    const recordIds = [
      ...new Set(
        (rawNotifications as ScheduledNotification[])
          .map((n) => n.record_id)
          .filter((id): id is string => id != null && id !== '')
      ),
    ]
    const disabledRecordIds = new Set<string>()
    if (recordIds.length > 0) {
      const { data: recordsOff } = await supabase
        .from('records')
        .select('id')
        .in('id', recordIds)
        .eq('notification_enabled', false)
      for (const r of recordsOff ?? []) {
        disabledRecordIds.add(r.id)
      }
      if (disabledRecordIds.size > 0) {
        const { error: cancelError } = await supabase
          .from('scheduled_notifications')
          .delete()
          .in('record_id', [...disabledRecordIds])
          .eq('status', 'pending')
        if (cancelError) {
          console.warn('Failed to cancel notifications for disabled records:', cancelError)
        }
      }
    }

    const notifications = (rawNotifications as ScheduledNotification[]).filter(
      (n) => n.record_id == null || n.record_id === '' || !disabledRecordIds.has(n.record_id)
    )

    if (notifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed_count: 0,
          message: 'No pending notifications to send (all disabled per record)',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${notifications.length} notifications`)

    // 3. 각 알림을 FCM으로 발송
    const results = {
      sent: 0,
      failed: 0,
    }

    for (const notification of notifications as ScheduledNotification[]) {
      try {
        const result = await sendFCMPush(
          firebaseProjectId,
          accessToken,
          notification.token,
          notification.title,
          notification.body
        )

        if (result.ok) {
          // 4. 성공 → status = 'sent', sent_at = now()
          const { error: updateError } = await supabase
            .from('scheduled_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id)

          if (updateError) {
            console.error(
              `Failed to update notification ${notification.id}:`,
              updateError
            )
          } else {
            results.sent++
          }
        } else {
          // 5. 실패 → status = 'failed', 만료/무효 토큰이면 user_push_tokens에서 삭제
          const { error: updateError } = await supabase
            .from('scheduled_notifications')
            .update({
              status: 'failed',
            })
            .eq('id', notification.id)

          if (updateError) {
            console.error(
              `Failed to update notification ${notification.id}:`,
              updateError
            )
          } else {
            results.failed++
          }

          if (result.invalidToken) {
            const { error: deleteError } = await supabase
              .from('user_push_tokens')
              .delete()
              .eq('token', notification.token)

            if (deleteError) {
              console.warn(
                `Failed to remove invalid token from user_push_tokens:`,
                deleteError
              )
            } else {
              console.log(
                `Removed invalid/expired token for user ${notification.user_id} (notification ${notification.id})`
              )
            }
          }
        }
      } catch (error) {
        console.error(
          `Error processing notification ${notification.id}:`,
          error
        )

        // 실패 처리
        const { error: updateError } = await supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
          })
          .eq('id', notification.id)

        if (updateError) {
          console.error(
            `Failed to update notification ${notification.id}:`,
            updateError
          )
        } else {
          results.failed++
        }
      }
    }

    console.log(
      `Processed ${notifications.length} notifications: ${results.sent} sent, ${results.failed} failed`
    )

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: notifications.length,
        sent: results.sent,
        failed: results.failed,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
