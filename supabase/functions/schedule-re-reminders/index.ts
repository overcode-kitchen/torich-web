// Supabase Edge Function: schedule-re-reminders
// pg_cron으로 매일 KST 00:10(UTC 15:10)에 호출되어,
// 어제 납입일이었는데 payment_history에 완료 기록이 없는 경우 "다음날 재알림"을 scheduled_notifications에 예약합니다.
/// <reference path="../../../types/supabase-deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  generatePaymentDates,
  type SchedulePushToken,
  type ScheduledNotificationRow,
} from '../_shared/notification-schedule.ts'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const BATCH_INSERT_SIZE = 500

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 현재 시각 기준 어제 날짜(KST) YYYY-MM-DD */
function getYesterdayKSTString(now: Date): string {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
  const yesterday = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000)
  return `${yesterday.getUTCFullYear()}-${pad(yesterday.getUTCMonth() + 1)}-${pad(yesterday.getUTCDate())}`
}

/** 오늘(KST) defaultTime 시각을 UTC Date로 반환 */
function getTodayAtDefaultTimeKSTAsUTC(now: Date, defaultTime: string): Date {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
  const y = kstNow.getUTCFullYear()
  const mo = kstNow.getUTCMonth()
  const d = kstNow.getUTCDate()
  const [h = 9, m = 0] = defaultTime.split(':').map(Number)
  const midnightKST = Date.UTC(y, mo, d, 0, 0, 0) - KST_OFFSET_MS
  return new Date(midnightKST + (h * 60 + m) * 60 * 1000)
}

/** paymentDate(Date)를 YYYY-MM-DD로 (로컬 날짜 기준) */
function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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
    const now = new Date()
    const yesterdayStr = getYesterdayKSTString(now)

    console.log(`schedule-re-reminders: yesterday(KST)=${yesterdayStr}`)

    // 1. 알림 ON인 record 전부 조회 (id, user_id, title, start_date, period_years, investment_days)
    const { data: records, error: recordsError } = await supabase
      .from('records')
      .select('id, user_id, title, start_date, period_years, investment_days')
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
    }>

    // 2. 어제가 유효 납입일인 record만 필터
    const recordsWithYesterdayDue: typeof recordsList = []
    for (const r of recordsList) {
      if (!r.investment_days?.length || !Array.isArray(r.investment_days)) continue
      const paymentDates = generatePaymentDates(
        r.start_date,
        r.period_years,
        r.investment_days
      )
      const hasYesterday = paymentDates.some((d) => toDateString(d) === yesterdayStr)
      if (hasYesterday) recordsWithYesterdayDue.push(r)
    }

    if (recordsWithYesterdayDue.length === 0) {
      console.log('No records with yesterday as payment date')
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          records_checked: recordsList.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const recordIds = recordsWithYesterdayDue.map((r) => r.id)

    // 3. payment_history에서 어제 완료된 (record_id, payment_date) 조회
    const { data: completed, error: completedError } = await supabase
      .from('payment_history')
      .select('record_id')
      .eq('payment_date', yesterdayStr)
      .in('record_id', recordIds)

    if (completedError) {
      console.error('Error fetching payment_history:', completedError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payment_history' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const completedRecordIds = new Set((completed || []).map((c) => c.record_id))

    // 4. 미완료 record만 유지
    const missedRecords = recordsWithYesterdayDue.filter(
      (r) => !completedRecordIds.has(r.id)
    )

    if (missedRecords.length === 0) {
      console.log('All yesterday payment dates are completed')
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          records_checked: recordsList.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userIds = [...new Set(missedRecords.map((r) => r.user_id))]

    // 5. user_settings: notification_re_reminder_enabled, notification_global_enabled, notification_default_time
    const { data: settingsList, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, notification_default_time, notification_global_enabled, notification_re_reminder_enabled')
      .in('user_id', userIds)

    if (settingsError) {
      console.error('Error fetching user_settings:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user_settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const enabledUserIds = new Set<string>()
    const userDefaultTime: Record<string, string> = {}
    for (const s of settingsList || []) {
      const row = s as {
        user_id: string
        notification_default_time?: string
        notification_global_enabled?: boolean
        notification_re_reminder_enabled?: boolean
      }
      if (
        row.notification_global_enabled === true &&
        row.notification_re_reminder_enabled === true
      ) {
        enabledUserIds.add(row.user_id)
        userDefaultTime[row.user_id] =
          row.notification_default_time || '09:00'
      }
    }

    const recordsForReminder = missedRecords.filter((r) =>
      enabledUserIds.has(r.user_id)
    )

    if (recordsForReminder.length === 0) {
      console.log('No users with re-reminder enabled for missed payments')
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          records_checked: recordsList.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 6. user_push_tokens 조회 (재알림 대상 user만)
    const { data: tokensByUser, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('user_id, token, platform')
      .in('user_id', [...enabledUserIds])

    if (tokensError) {
      console.error('Error fetching user_push_tokens:', tokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const tokensMap = new Map<string, SchedulePushToken[]>()
    for (const t of tokensByUser || []) {
      const row = t as { user_id: string; token: string; platform: string }
      if (!tokensMap.has(row.user_id)) tokensMap.set(row.user_id, [])
      tokensMap.get(row.user_id)!.push({ token: row.token, platform: row.platform })
    }

    // 7. 재알림 행 생성: 오늘(KST) 기본 알림 시간에 발송, notification_type = 're_reminder'
    const allRows: ScheduledNotificationRow[] = []
    for (const record of recordsForReminder) {
      const tokens = tokensMap.get(record.user_id)
      if (!tokens?.length) continue

      const defaultTime = userDefaultTime[record.user_id] || '09:00'
      const scheduledAtUTC = getTodayAtDefaultTimeKSTAsUTC(now, defaultTime)
      const scheduledAtStr = scheduledAtUTC.toISOString()

      const bodyText = `${record.title} - 납입일이 지났어요. 오늘 완료해 주세요.`

      for (const token of tokens) {
        allRows.push({
          user_id: record.user_id,
          record_id: record.id,
          token: token.token,
          title: record.title,
          body: bodyText,
          scheduled_at: scheduledAtStr,
          status: 'pending',
          notification_type: 're_reminder',
        })
      }
    }

    if (allRows.length === 0) {
      console.log('No push tokens for users with missed payments')
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          records_checked: recordsList.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 8. 배치 upsert (unique record_id,scheduled_at,token + ignoreDuplicates)
    for (let i = 0; i < allRows.length; i += BATCH_INSERT_SIZE) {
      const chunk = allRows.slice(i, i + BATCH_INSERT_SIZE)
      const { error: upsertError } = await supabase
        .from('scheduled_notifications')
        .upsert(chunk, {
          onConflict: 'record_id,scheduled_at,token',
          ignoreDuplicates: true,
        })

      if (upsertError) {
        console.error('Error upserting re-reminder notifications:', upsertError)
        return new Response(
          JSON.stringify({ error: 'Failed to insert re-reminders' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(
      `Scheduled ${allRows.length} re-reminders for ${recordsForReminder.length} records (yesterday=${yesterdayStr})`
    )

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_count: allRows.length,
        records_with_re_reminder: recordsForReminder.length,
        yesterday: yesterdayStr,
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
