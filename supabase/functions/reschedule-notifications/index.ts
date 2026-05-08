// Supabase Edge Function: reschedule-notifications
// user_settings 테이블 UPDATE 시 Database Webhook으로 호출되어
// 기본 알림 시간/사전 알림 변경 시 해당 유저의 기존 pending 알림을 새 설정으로 재예약합니다.
//
// Webhook: user_settings, Update. Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
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

interface UserSettingsWebhookPayload {
  type: string
  table: string
  record: {
    user_id: string
    notification_default_time?: string
    notification_pre_reminder?: string
    [key: string]: unknown
  }
  old_record: {
    user_id: string
    notification_default_time?: string
    notification_pre_reminder?: string
    [key: string]: unknown
  } | null
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const payload: UserSettingsWebhookPayload = await req.json()

    if (!payload.record?.user_id) {
      console.error('Invalid payload: missing record.user_id')
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userId = payload.record.user_id as string
    const oldRecord = payload.old_record

    // 기본 알림 시간/사전 알림이 실제로 변경된 경우에만 재예약 (선택적 최적화)
    if (oldRecord) {
      const timeChanged =
        payload.record.notification_default_time !== oldRecord.notification_default_time
      const preReminderChanged =
        payload.record.notification_pre_reminder !== oldRecord.notification_pre_reminder
      if (!timeChanged && !preReminderChanged) {
        console.log(`No notification time/pre_reminder change for user: ${userId}, skipping`)
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: 'No relevant change' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const USER_SETTINGS_COLUMNS =
      'notification_global_enabled, notification_default_time, notification_pre_reminder, notification_skip_weekend_holiday'
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select(USER_SETTINGS_COLUMNS)
      .eq('user_id', userId)
      .single()

    if (settingsError || !settings) {
      console.error('Error fetching user settings:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userSettings = settings as ScheduleUserSettings

    if (!userSettings.notification_global_enabled) {
      console.log(`Global notifications disabled for user: ${userId}, skipping reschedule`)
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Global notifications disabled' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: records, error: recordsError } = await supabase
      .from('records')
      .select('id, user_id, title, start_date, period_years, investment_days, notification_enabled, monthly_amount, unit_type, monthly_shares')
      .eq('user_id', userId)
      .eq('notification_enabled', true)

    if (recordsError) {
      console.error('Error fetching records:', recordsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch records' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const recordsList = (records || []) as Array<{
      id: string
      user_id: string
      title: string
      start_date: string
      period_years: number | null
      investment_days: number[]
      notification_enabled?: boolean
      monthly_amount?: number
    }>

    const validRecords = recordsList.filter(
      (r) =>
        r.investment_days &&
        Array.isArray(r.investment_days) &&
        r.investment_days.length > 0
    )

    if (validRecords.length === 0) {
      console.log(`No valid records to reschedule for user: ${userId}`)
      const { error: deleteError } = await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'pending')

      if (deleteError) {
        console.warn('Failed to delete existing pending notifications:', deleteError)
      }
      return new Response(
        JSON.stringify({
          success: true,
          deleted_count: 0,
          scheduled_count: 0,
          records_processed: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 배치 삭제: 해당 유저의 모든 pending 알림 삭제
    const { error: deleteError } = await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (deleteError) {
      console.error('Error deleting pending notifications:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete existing notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('token, platform')
      .eq('user_id', userId)

    if (tokensError || !tokens || tokens.length === 0) {
      console.log(`No push tokens for user: ${userId}, reschedule complete (0 new notifications)`)
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          records_processed: validRecords.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const existingScheduledAts = new Set<string>()
    const allNotifications: ScheduledNotificationRow[] = []

    for (const r of validRecords) {
      const scheduleRecord: ScheduleRecord = {
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        start_date: r.start_date,
        period_years: r.period_years,
        investment_days: r.investment_days,
        notification_enabled: r.notification_enabled,
        monthly_amount: r.monthly_amount,
      }
      const rows = buildNotificationRows(
        scheduleRecord,
        userSettings,
        tokens as SchedulePushToken[],
        existingScheduledAts,
        now
      )
      allNotifications.push(...rows)
    }

    if (allNotifications.length === 0) {
      console.log(`No future notifications to schedule for user: ${userId}`)
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          records_processed: validRecords.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 배치 insert: 청크 단위로 upsert
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
        return new Response(
          JSON.stringify({ error: 'Failed to insert notifications' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(
      `Rescheduled ${allNotifications.length} notifications for user: ${userId} (${validRecords.length} records)`
    )

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_count: allNotifications.length,
        records_processed: validRecords.length,
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
