// Supabase Edge Function: backfill-notifications
// user_push_tokens 테이블 INSERT/UPDATE 시 Database Webhook으로 호출되어,
// 방금 저장된 토큰 하나에 대해 기존 적립 항목(records)의 미래 납입 알림을 예약한다.
//
// 왜 필요한가 (설계 메모):
//  · scheduled_notifications 행은 예약 시점의 FCM 토큰을 그대로 박아 저장한다
//    (_shared/notification-schedule.ts). record 알림을 만드는 경로는
//    schedule-notification(records INSERT/UPDATE 웹훅)과 reschedule-notifications
//    (user_settings 변경 웹훅) 둘뿐이라, "토큰만 새로 생기는" 경우—기기 교체·재설치·
//    권한 거부 후 재허용—에는 아무 경로도 발화하지 않는다. 그 결과 새 토큰에는 예약이
//    하나도 없어, 정기 알림이 영구히 오지 않는다(재알림만 옴). Closes #50.
//  · schedule-goal-notifications의 컨벤션을 따른다: 운영 중인 예약 경로를 건드리지 않고
//    독립 함수로 추가한다.
//
// 동작 원칙:
//  · reschedule-notifications와 달리 기존 pending을 삭제하지 않는다(파괴적 회피).
//    다른 토큰(기존 기기)의 예약을 건드리면 안 되므로, 방금 들어온 토큰 하나에만 삽입한다.
//  · 중복은 삽입 전 조회 없이 DB upsert(onConflict record_id,scheduled_at,token +
//    ignoreDuplicates)로만 거른다. buildNotificationRows에 빈 existingScheduledAts를
//    넘기는 이유가 이것이다(reschedule-notifications와 동일). 삽입 전 조회를 하면 옛 토큰
//    행이 같은 시각을 점유해 새 토큰 행이 전부 스킵되는 함정에 빠진다.
//
// Webhook 설정: user_push_tokens, Insert + Update.
//   Authorization 헤더에 Service Role Key를 넣어야 한다.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Deno ambient 타입 선언은 import로 대체 불가
/// <reference path="../../../types/supabase-deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  type ScheduleRecord,
  type ScheduleUserSettings,
  type SchedulePushToken,
  type ScheduledNotificationRow,
  buildNotificationRows,
} from '../_shared/notification-schedule.ts'

const BATCH_INSERT_SIZE = 500

const USER_SETTINGS_COLUMNS =
  'notification_global_enabled, notification_default_time, notification_pre_reminder, notification_skip_weekend_holiday'

const RECORD_COLUMNS =
  'id, user_id, title, start_date, period_years, investment_days, notification_enabled, monthly_amount, unit_type, monthly_shares, record_type'

interface PushTokenRecord {
  user_id: string
  token: string
  platform: string
}

interface WebhookPayload {
  type: string
  table: string
  record: PushTokenRecord | null
  old_record: PushTokenRecord | null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return json({ error: 'Missing environment variables' }, 500)
    }

    const payload: WebhookPayload = await req.json()
    const record = payload.record

    if (!record?.user_id || !record?.token) {
      console.error('Invalid payload: missing record.user_id or record.token')
      return json({ error: 'Invalid payload' }, 400)
    }

    // 콜드스타트마다 saveTokenToDB가 upsert→UPDATE 웹훅을 발화시킨다. 토큰이 그대로면
    // 예약도 그대로이므로, token이 실제로 바뀐 UPDATE만 처리해 불필요한 재빌드를 막는다.
    if (payload.type === 'UPDATE' && payload.old_record?.token === record.token) {
      console.log(`Token unchanged for user ${record.user_id}, skipping backfill`)
      return json({ success: true, skipped: true, reason: 'Token unchanged' })
    }

    const userId = record.user_id
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 사용자 알림 설정 — 전역 OFF면 예약하지 않는다.
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select(USER_SETTINGS_COLUMNS)
      .eq('user_id', userId)
      .single()

    if (settingsError || !settings) {
      // 설정 행이 없으면 아직 예약할 근거가 없다(에러 아님).
      console.log(`No user_settings for user: ${userId}, nothing to backfill`)
      return json({ success: true, scheduled_count: 0, reason: 'No settings' })
    }

    const userSettings = settings as ScheduleUserSettings

    if (!userSettings.notification_global_enabled) {
      console.log(`Global notifications disabled for user: ${userId}, skipping backfill`)
      return json({ success: true, scheduled_count: 0, reason: 'Global notifications disabled' })
    }

    // 2. 알림 켜진 적립 항목만 대상.
    const { data: records, error: recordsError } = await supabase
      .from('records')
      .select(RECORD_COLUMNS)
      .eq('user_id', userId)
      .eq('notification_enabled', true)

    if (recordsError) {
      console.error('Error fetching records:', recordsError)
      return json({ error: 'Failed to fetch records' }, 500)
    }

    const recordsList = (records ?? []) as ScheduleRecord[]
    const validRecords = recordsList.filter(
      (r) =>
        Array.isArray(r.investment_days) && r.investment_days.length > 0,
    )

    if (validRecords.length === 0) {
      console.log(`No records to backfill for user: ${userId}`)
      return json({ success: true, scheduled_count: 0, records_processed: 0 })
    }

    // 3. 방금 들어온 토큰 하나에만 예약을 만든다(다른 기기 예약은 그대로 둔다).
    const tokens: SchedulePushToken[] = [{ token: record.token, platform: record.platform }]

    const now = new Date()
    // 삽입 전 조회 없이 DB upsert로만 중복을 거른다(빈 Set 유지).
    const existingScheduledAts = new Set<string>()
    const allNotifications: ScheduledNotificationRow[] = []

    for (const r of validRecords) {
      const rows = buildNotificationRows(r, userSettings, tokens, existingScheduledAts, now)
      allNotifications.push(...rows)
    }

    if (allNotifications.length === 0) {
      console.log(`No future notifications to backfill for user: ${userId}`)
      return json({ success: true, scheduled_count: 0, records_processed: validRecords.length })
    }

    // 4. 배치 upsert. 적립형은 record당 10년치가 생성되므로 청크로 나눠 타임아웃을 피한다.
    for (let i = 0; i < allNotifications.length; i += BATCH_INSERT_SIZE) {
      const chunk = allNotifications.slice(i, i + BATCH_INSERT_SIZE)
      const { error: upsertError } = await supabase
        .from('scheduled_notifications')
        .upsert(chunk, {
          onConflict: 'record_id,scheduled_at,token',
          ignoreDuplicates: true,
        })

      if (upsertError) {
        console.error('Error upserting notification chunk:', upsertError)
        return json({ error: 'Failed to insert notifications' }, 500)
      }
    }

    console.log(
      `Backfilled ${allNotifications.length} notifications for user: ${userId} ` +
        `(${validRecords.length} records, 1 token)`,
    )

    return json({
      success: true,
      scheduled_count: allNotifications.length,
      records_processed: validRecords.length,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return json({ error: 'Internal server error' }, 500)
  }
})
