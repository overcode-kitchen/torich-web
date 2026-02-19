// Supabase Edge Function: send-push
// pg_cron으로 1분마다 호출되어 scheduled_notifications의 pending 항목을 FCM으로 발송

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getToken } from 'https://deno.land/x/google_jwt_sa@v0.2.5/mod.ts'

interface ScheduledNotification {
  id: string
  user_id: string
  record_id: string
  token: string
  title: string
  body: string
  scheduled_at: string
  status: string
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
 * FCM HTTP v1 API로 푸시 알림 발송
 */
async function sendFCMPush(
  projectId: string,
  accessToken: string,
  token: string,
  title: string,
  body: string
): Promise<boolean> {
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
    return false
  }

  return true
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
    const { data: notifications, error: fetchError } = await supabase
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

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed_count: 0,
          message: 'No pending notifications to send',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${notifications.length} notifications`)

    // 2. 각 알림을 FCM으로 발송
    const results = {
      sent: 0,
      failed: 0,
    }

    for (const notification of notifications as ScheduledNotification[]) {
      try {
        const success = await sendFCMPush(
          firebaseProjectId,
          accessToken,
          notification.token,
          notification.title,
          notification.body
        )

        if (success) {
          // 3. 성공 → status = 'sent', sent_at = now()
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
          // 4. 실패 → status = 'failed'
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
