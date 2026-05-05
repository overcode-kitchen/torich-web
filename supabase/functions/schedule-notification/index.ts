// Supabase Edge Function: schedule-notification
// records 테이블 INSERT 시 Database Webhook으로 호출되어 알림 예약
//
// Webhook 설정: HTTP Headers의 Authorization에는 반드시 Service Role Key를 사용하세요.
/// <reference path="../../../types/supabase-deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  type ScheduleRecord,
  type ScheduleUserSettings,
  type SchedulePushToken,
  type ScheduledNotificationRow,
  buildNotificationRows,
} from '../_shared/notification-schedule.ts'

interface WebhookPayload {
  type: string
  table: string
  record: {
    id: string
    user_id: string
    title: string
    start_date: string
    period_years: number | null
    investment_days: number[]
    notification_enabled?: boolean
    monthly_amount?: number
    unit_type?: 'amount' | 'shares'
    monthly_shares?: number | null
  }
  old_record: null
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
    const payload: WebhookPayload = await req.json()

    if (!payload.record) {
      console.error('Invalid payload: missing record')
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const record = payload.record
    const {
      id: recordId,
      user_id: userId,
      title,
      start_date: startDate,
      period_years: periodYears,
      investment_days: investmentDays,
      notification_enabled: notificationEnabled = true,
      monthly_amount: monthlyAmount,
      unit_type: unitType,
      monthly_shares: monthlyShares,
    } = record

    if (notificationEnabled === false) {
      console.log(`Record ${recordId}: notification_enabled is false, skipping schedule`)
      return new Response(
        JSON.stringify({ message: 'Per-investment notifications disabled for this record' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(
      `Processing record: ${recordId} for user: ${userId}, period: ${periodYears} years, investment_days: ${investmentDays}`
    )

    if (
      !investmentDays ||
      !Array.isArray(investmentDays) ||
      investmentDays.length === 0
    ) {
      console.log(`Invalid investment_days for record: ${recordId}`)
      return new Response(
        JSON.stringify({ message: 'Invalid investment_days' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const USER_SETTINGS_COLUMNS =
      'notification_global_enabled, notification_default_time, notification_pre_reminder, notification_skip_weekend_holiday'
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select(USER_SETTINGS_COLUMNS)
      .eq('user_id', userId)
      .single()

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!settings) {
      console.log(`No settings found for user: ${userId}`)
      return new Response(
        JSON.stringify({ message: 'No settings found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userSettings = settings as ScheduleUserSettings

    if (!userSettings.notification_global_enabled) {
      console.log(`Global notifications disabled for user: ${userId}`)
      return new Response(
        JSON.stringify({ message: 'Global notifications disabled' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: existingNotifications, error: existingError } = await supabase
      .from('scheduled_notifications')
      .select('record_id, scheduled_at')
      .eq('record_id', recordId)

    if (existingError) {
      console.error('Error fetching existing notifications:', existingError)
    }

    const existingScheduledAts = new Set<string>()
    if (existingNotifications) {
      for (const notif of existingNotifications) {
        existingScheduledAts.add(new Date(notif.scheduled_at).toISOString())
      }
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('token, platform')
      .eq('user_id', userId)

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No push tokens found for user: ${userId}`)
      return new Response(
        JSON.stringify({ message: 'No push tokens found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const scheduleRecord: ScheduleRecord = {
      id: recordId,
      user_id: userId,
      title,
      start_date: startDate,
      period_years: periodYears,
      investment_days: investmentDays,
      notification_enabled: notificationEnabled,
      monthly_amount: monthlyAmount,
      unit_type: unitType,
      monthly_shares: monthlyShares,
    }

    const now = new Date()
    const notifications: ScheduledNotificationRow[] = buildNotificationRows(
      scheduleRecord,
      userSettings,
      tokens as SchedulePushToken[],
      existingScheduledAts,
      now
    )

    if (notifications.length === 0) {
      console.log(
        `No new notifications to create (all duplicates) for record: ${recordId}`
      )
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          message: 'All notifications already exist',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { error: upsertError } = await supabase
      .from('scheduled_notifications')
      .upsert(notifications, {
        onConflict: 'record_id,scheduled_at,token',
        ignoreDuplicates: true,
      })

    if (upsertError) {
      console.error('Error upserting scheduled notifications:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(
      `Successfully scheduled ${notifications.length} notifications for user: ${userId}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_count: notifications.length,
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
