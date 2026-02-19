// Supabase Edge Function: schedule-notification
// records 테이블 INSERT 시 Database Webhook으로 호출되어 알림 예약

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KST_OFFSET_HOURS = 9 // KST는 UTC+9

interface WebhookPayload {
  type: string
  table: string
  record: {
    id: string
    user_id: string
    title: string
    start_date: string // YYYY-MM-DD 형식
    period_years: number
    investment_days: number[] // 납입일 배열 예: [18, 19, 20, 21]
  }
  old_record: null
}

interface UserSettings {
  notification_global_enabled: boolean
  notification_default_time: string // HH:MM:SS 형식
  notification_pre_reminder: string // '0', '1', '3', '7'
  notification_dnd_enabled: boolean
  notification_dnd_start: string // HH:MM:SS 형식
  notification_dnd_end: string // HH:MM:SS 형식
}

interface PushToken {
  token: string
  platform: string
}

/**
 * KST 시간을 UTC로 변환
 */
function kstToUTC(kstDate: Date): Date {
  const utcDate = new Date(kstDate)
  utcDate.setHours(utcDate.getHours() - KST_OFFSET_HOURS)
  return utcDate
}

/**
 * 날짜 문자열에 일수를 더하거나 빼기
 */
function addDays(dateStr: string, days: number): Date {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date
}

/**
 * 날짜에 년수를 더하기
 */
function addYears(date: Date, years: number): Date {
  const newDate = new Date(date)
  newDate.setFullYear(newDate.getFullYear() + years)
  return newDate
}

/**
 * 특정 월의 특정 날짜가 유효한지 확인 (예: 2월 30일은 유효하지 않음)
 */
function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * 납입일 목록 생성
 * start_date부터 (start_date + period_years년)까지 매월 각 investment_days 날짜마다
 * 날짜 단위 스킵은 하지 않음 (scheduled_at 계산 후에 스킵)
 */
function generatePaymentDates(
  startDate: string,
  periodYears: number,
  investmentDays: number[]
): Date[] {
  const dates: Date[] = []
  const start = new Date(startDate)
  const end = addYears(start, periodYears)

  // start_date부터 end까지 매월 반복
  let current = new Date(start)
  
  while (current < end) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1 // 1-12

    // 각 납입일마다 날짜 생성
    for (const day of investmentDays) {
      // 유효한 날짜인지 확인 (예: 2월 30일은 스킵)
      if (isValidDate(year, month, day)) {
        const paymentDate = new Date(year, month - 1, day)
        dates.push(paymentDate)
      }
    }

    // 다음 달로 이동
    current.setMonth(current.getMonth() + 1)
  }

  return dates.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * 시간 문자열(HH:MM:SS)을 Date 객체에 적용
 */
function setTime(date: Date, timeStr: string): Date {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number)
  const newDate = new Date(date)
  newDate.setHours(hours, minutes, seconds || 0, 0)
  return newDate
}

/**
 * 시간이 두 시간 사이에 있는지 확인 (하루를 넘어갈 수 있음)
 */
function isTimeBetween(
  checkTime: Date,
  startTime: Date,
  endTime: Date
): boolean {
  const check = checkTime.getHours() * 60 + checkTime.getMinutes()
  const start = startTime.getHours() * 60 + startTime.getMinutes()
  const end = endTime.getHours() * 60 + endTime.getMinutes()

  if (start <= end) {
    // 같은 날 내 범위 (예: 22:00 ~ 23:00)
    return check >= start && check <= end
  } else {
    // 하루를 넘어가는 범위 (예: 22:00 ~ 08:00)
    return check >= start || check <= end
  }
}

/**
 * 알림 시각 계산 (KST 기준)
 */
function calculateScheduledAt(
  startDate: string,
  preReminder: string,
  defaultTime: string
): Date {
  // pre_days 파싱
  const preDays = parseInt(preReminder) || 0

  // base_date 계산 (start_date에서 pre_days 빼기)
  const baseDate = addDays(startDate, -preDays)

  // scheduled_at 계산 (base_date + default_time)
  const scheduledAt = setTime(baseDate, defaultTime)

  return scheduledAt
}

/**
 * 방해금지 시간 체크 및 조정
 */
function adjustForDnd(
  scheduledAt: Date,
  dndEnabled: boolean,
  dndStart: string,
  dndEnd: string
): Date {
  if (!dndEnabled) {
    return scheduledAt
  }

  const scheduledTime = new Date(scheduledAt)
  const startTime = setTime(new Date(scheduledAt), dndStart)
  const endTime = setTime(new Date(scheduledAt), dndEnd)

  // 방해금지 시간 내에 있으면 해당 날짜의 dnd_end로 조정
  if (isTimeBetween(scheduledTime, startTime, endTime)) {
    const adjustedTime = setTime(new Date(scheduledAt), dndEnd)
    
    // dnd_end가 scheduled_at보다 이전 시간이면 (하루를 넘어가는 경우) 다음날로 이동
    if (adjustedTime < scheduledTime) {
      adjustedTime.setDate(adjustedTime.getDate() + 1)
    }
    
    return adjustedTime
  }

  return scheduledAt
}

Deno.serve(async (req) => {
  try {
    // 환경 변수 확인
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Webhook payload 파싱
    const payload: WebhookPayload = await req.json()

    if (!payload.record) {
      console.error('Invalid payload: missing record')
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const {
      id: recordId,
      user_id: userId,
      title,
      start_date: startDate,
      period_years: periodYears,
      investment_days: investmentDays,
    } = payload.record

    console.log(
      `Processing record: ${recordId} for user: ${userId}, period: ${periodYears} years, investment_days: ${investmentDays}`
    )

    // investment_days 유효성 검사
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

    // 1. user_settings 조회
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select(
        'notification_global_enabled, notification_default_time, notification_pre_reminder, notification_dnd_enabled, notification_dnd_start, notification_dnd_end'
      )
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

    const userSettings = settings as UserSettings

    // 2. notification_global_enabled 확인
    if (!userSettings.notification_global_enabled) {
      console.log(`Global notifications disabled for user: ${userId}`)
      return new Response(
        JSON.stringify({ message: 'Global notifications disabled' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. 납입일 목록 생성
    const paymentDates = generatePaymentDates(
      startDate,
      periodYears,
      investmentDays
    )

    if (paymentDates.length === 0) {
      console.log(`No valid payment dates found for record: ${recordId}`)
      return new Response(
        JSON.stringify({ message: 'No valid payment dates' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(
      `Generated ${paymentDates.length} payment dates for record: ${recordId}`
    )

    // 4. 기존 scheduled_notifications에서 중복 체크를 위한 조회
    const { data: existingNotifications, error: existingError } =
      await supabase
        .from('scheduled_notifications')
        .select('record_id, scheduled_at')
        .eq('record_id', recordId)

    if (existingError) {
      console.error(
        'Error fetching existing notifications:',
        existingError
      )
      // 에러가 발생해도 계속 진행 (중복 체크는 실패하지만 알림 생성은 시도)
    }

    // 기존 알림의 scheduled_at을 Set으로 저장 (중복 체크용)
    const existingScheduledAts = new Set<string>()
    if (existingNotifications) {
      for (const notif of existingNotifications) {
        // UTC 시간을 ISO 문자열로 변환하여 저장
        existingScheduledAts.add(notif.scheduled_at)
      }
    }

    // 5. user_push_tokens 조회
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

    // 6. 각 납입일마다 알림 시각 계산 및 알림 생성
    const preDays = parseInt(userSettings.notification_pre_reminder) || 0
    const notifications: Array<{
      user_id: string
      record_id: string
      token: string
      title: string
      body: string
      scheduled_at: string
      status: string
      notification_type: string
    }> = []

    for (const paymentDate of paymentDates) {
      // 알림 시각 계산 (KST 기준)
      const paymentDateStr = paymentDate.toISOString().split('T')[0] // YYYY-MM-DD
      const scheduledAtKST = calculateScheduledAt(
        paymentDateStr,
        userSettings.notification_pre_reminder,
        userSettings.notification_default_time
      )

      // 방해금지 체크 및 조정
      const adjustedScheduledAtKST = adjustForDnd(
        scheduledAtKST,
        userSettings.notification_dnd_enabled,
        userSettings.notification_dnd_start,
        userSettings.notification_dnd_end
      )

      // KST → UTC 변환
      const scheduledAtUTC = kstToUTC(adjustedScheduledAtKST)
      const scheduledAtUTCStr = scheduledAtUTC.toISOString()

      // 과거 알림 시각 체크: scheduled_at <= now()인 경우 스킵
      const now = new Date()
      if (scheduledAtUTC <= now) {
        console.log(
          `Skipping past notification: record_id=${recordId}, scheduled_at=${scheduledAtUTCStr} (now: ${now.toISOString()})`
        )
        continue
      }

      // 중복 체크: record_id + scheduled_at 조합이 이미 존재하면 스킵
      if (existingScheduledAts.has(scheduledAtUTCStr)) {
        console.log(
          `Skipping duplicate notification: record_id=${recordId}, scheduled_at=${scheduledAtUTCStr}`
        )
        continue
      }

      // 알림 본문 생성
      let bodyText = title
      if (preDays === 0) {
        bodyText = `${title} - 오늘 알림`
      } else {
        bodyText = `${title} - ${preDays}일 전 알림`
      }

      // 각 토큰마다 알림 생성
      for (const tokenData of tokens as PushToken[]) {
        notifications.push({
          user_id: userId,
          record_id: recordId,
          token: tokenData.token,
          title: title,
          body: bodyText,
          scheduled_at: scheduledAtUTCStr,
          status: 'pending',
          notification_type: 'reminder',
        })
      }
    }

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

    // 7. 모든 알림을 한 번에 INSERT
    const { error: insertError } = await supabase
      .from('scheduled_notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Error inserting scheduled notifications:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(
      `Successfully scheduled ${notifications.length} notifications (${paymentDates.length} payment dates × ${tokens.length} tokens) for user: ${userId}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_count: notifications.length,
        payment_dates_count: paymentDates.length,
        tokens_count: tokens.length,
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
