// Supabase Edge Function: schedule-goal-notifications
// pg_cron으로 매일 KST 00:20(UTC 15:20)에 호출되어,
// 마감일이 D-7 / D-1 / D-0인 목적(goals)에 대해 마감일 알림을 scheduled_notifications에 예약합니다.
//
// 설계 메모:
//  · 기존 함수(schedule-notification / reschedule-notifications / schedule-re-reminders)를 수정하지 않고
//    독립 함수로 추가한다. 운영 중인 record 알림 예약 경로를 건드리지 않기 위함이다.
//  · 예약 행은 record_id = null, goal_id = 목적 id 로 넣는다.
//    send-push는 record_id가 null인 행을 그대로 발송하므로(send-push/index.ts:218) 별도 처리가 필요 없다.
//  · D-7/D-1/D-0 세 시점은 목적 수정 화면의 안내 문구("일주일 전·하루 전·당일에 알려드려요")를 그대로 따른다.
//  · 주말·공휴일 보정(notification_skip_weekend_holiday)은 적용하지 않는다.
//    마감일은 사용자가 정한 고정 날짜이고, 다음 영업일로 미루면 마감일을 넘겨 알리는 모순이 생긴다.
/// <reference path="../../../types/supabase-deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const BATCH_INSERT_SIZE = 500

/** 알림을 보낼 D-day 시점(일). 목적 수정 화면 안내 문구와 일치해야 한다. */
const NOTIFY_DAYS_BEFORE: readonly number[] = [7, 1, 0]

const MS_PER_DAY = 24 * 60 * 60 * 1000

interface GoalRow {
  id: string
  user_id: string
  name: string
  target_date: string
}

interface GoalNotificationRow {
  user_id: string
  record_id: null
  goal_id: string
  token: string
  title: string
  body: string
  scheduled_at: string
  status: string
  notification_type: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 오늘(KST) YYYY-MM-DD */
function getTodayKSTString(now: Date): string {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
  return `${kstNow.getUTCFullYear()}-${pad(kstNow.getUTCMonth() + 1)}-${pad(kstNow.getUTCDate())}`
}

/** YYYY-MM-DD(KST) + HH:mm(KST) → UTC Date */
function getKSTDateTimeAsUTC(dateStr: string, defaultTime: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h = 9, m = 0] = defaultTime.split(':').map(Number)
  const midnightKST = Date.UTC(y, mo - 1, d, 0, 0, 0) - KST_OFFSET_MS
  return new Date(midnightKST + (h * 60 + m) * 60 * 1000)
}

/**
 * 두 YYYY-MM-DD(KST) 사이의 일수 차이 (toDate - fromDate).
 * 자정 UTC 기준으로 환산해 비교하므로 DST·타임존 영향이 없다.
 */
function diffInDays(fromDateStr: string, toDateStr: string): number | null {
  const [fy, fm, fd] = fromDateStr.split('-').map(Number)
  const [ty, tm, td] = toDateStr.split('-').map(Number)
  if (!fy || !fm || !fd || !ty || !tm || !td) return null
  const from = Date.UTC(fy, fm - 1, fd)
  const to = Date.UTC(ty, tm - 1, td)
  return Math.round((to - from) / MS_PER_DAY)
}

/** 푸시 본문용 마감일 포맷 (YYYY-MM-DD → "M월 D일") */
function formatDeadline(isoDateStr: string): string {
  const [, m, d] = isoDateStr.split('-').map(Number)
  if (!m || !d) return isoDateStr
  return `${m}월 ${d}일`
}

/** D-day별 푸시 제목·본문 */
function buildGoalPushText(
  goalName: string,
  targetDate: string,
  daysBefore: number,
): { title: string; body: string } {
  const deadline = formatDeadline(targetDate)
  if (daysBefore === 0) {
    return {
      title: `오늘 "${goalName}" 마감일이에요`,
      body: `${deadline}, 목적 마감일이에요. 그동안 모은 금액을 확인해 보세요.`,
    }
  }
  if (daysBefore === 1) {
    return {
      title: `"${goalName}" 마감이 하루 남았어요`,
      body: `내일 ${deadline}이 마감일이에요.`,
    }
  }
  return {
    title: `"${goalName}" 마감이 ${daysBefore}일 남았어요`,
    body: `${deadline}이 마감일이에요.`,
  }
}

Deno.serve(async () => {
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
    const todayKSTStr = getTodayKSTString(now)

    console.log(`schedule-goal-notifications: today(KST)=${todayKSTStr}`)

    // 1. 알림 대상 목적 조회
    //    마감일이 있고 / 알림 ON / 보관되지 않고 / 아직 달성하지 않은 목적만.
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, user_id, name, target_date')
      .eq('notification_enabled', true)
      .not('target_date', 'is', null)
      .is('archived_at', null)
      .is('completed_at', null)

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch goals' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const goalsList = (goals || []) as GoalRow[]

    // 2. 오늘이 D-7 / D-1 / D-0에 해당하는 목적만 남긴다.
    //    마감일이 지난 목적(daysUntil < 0)은 제외.
    const dueGoals: Array<{ goal: GoalRow; daysBefore: number }> = []
    for (const goal of goalsList) {
      if (!goal.target_date) continue
      const daysUntil = diffInDays(todayKSTStr, goal.target_date)
      if (daysUntil === null) continue
      if (!NOTIFY_DAYS_BEFORE.includes(daysUntil)) continue
      dueGoals.push({ goal, daysBefore: daysUntil })
    }

    if (dueGoals.length === 0) {
      console.log('No goals with deadline at D-7 / D-1 / D-0')
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          goals_checked: goalsList.length,
          today: todayKSTStr,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userIds = [...new Set(dueGoals.map((d) => d.goal.user_id))]

    // 3. user_settings: 전역 알림 ON인 사용자만 + 기본 알림 시간
    //    행이 없는 사용자(신규)는 기본값(전역 ON / 09:00)으로 간주한다.
    //    record 알림 경로도 동일 기본값을 쓰므로(notification-settings.ts) 일관된다.
    const { data: settingsList, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, notification_default_time, notification_global_enabled')
      .in('user_id', userIds)

    if (settingsError) {
      console.error('Error fetching user_settings:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user_settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const disabledUserIds = new Set<string>()
    const userDefaultTime: Record<string, string> = {}
    for (const s of settingsList || []) {
      const row = s as {
        user_id: string
        notification_default_time?: string
        notification_global_enabled?: boolean
      }
      if (row.notification_global_enabled === false) {
        disabledUserIds.add(row.user_id)
        continue
      }
      userDefaultTime[row.user_id] = row.notification_default_time || '09:00'
    }

    const targetGoals = dueGoals.filter(
      (d) => !disabledUserIds.has(d.goal.user_id)
    )

    if (targetGoals.length === 0) {
      console.log('All due goals belong to users with global notification off')
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          goals_checked: goalsList.length,
          today: todayKSTStr,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. user_push_tokens 조회
    const { data: tokenRows, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('user_id, token')
      .in('user_id', [...new Set(targetGoals.map((d) => d.goal.user_id))])

    if (tokensError) {
      console.error('Error fetching user_push_tokens:', tokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const tokensMap = new Map<string, string[]>()
    for (const t of tokenRows || []) {
      const row = t as { user_id: string; token: string }
      if (!tokensMap.has(row.user_id)) tokensMap.set(row.user_id, [])
      tokensMap.get(row.user_id)!.push(row.token)
    }

    // 5. 이미 예약된 행 조회 후 코드에서 중복 제거.
    //    dedup용 unique 인덱스는 partial index(WHERE goal_id IS NOT NULL AND record_id IS NULL)라
    //    PostgREST upsert의 onConflict로 지정할 수 없다(컬럼만 받고 predicate를 못 넘김).
    //    따라서 조회 후 코드에서 걸러내고 일반 insert를 쓴다. 인덱스는 최후의 방어선으로 남는다.
    const { data: existingRows, error: existingError } = await supabase
      .from('scheduled_notifications')
      .select('goal_id, scheduled_at, token')
      .in('goal_id', targetGoals.map((d) => d.goal.id))
      .is('record_id', null)

    if (existingError) {
      console.error('Error fetching existing goal notifications:', existingError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch existing notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const existingKeys = new Set<string>()
    for (const r of existingRows || []) {
      const row = r as { goal_id: string; scheduled_at: string; token: string }
      existingKeys.add(
        `${row.goal_id}|${new Date(row.scheduled_at).toISOString()}|${row.token}`
      )
    }

    // 6. 예약 행 생성
    const allRows: GoalNotificationRow[] = []
    for (const { goal, daysBefore } of targetGoals) {
      const tokens = tokensMap.get(goal.user_id)
      if (!tokens?.length) continue

      const defaultTime = userDefaultTime[goal.user_id] || '09:00'
      const scheduledAtStr = getKSTDateTimeAsUTC(
        todayKSTStr,
        defaultTime
      ).toISOString()
      const { title, body } = buildGoalPushText(
        goal.name,
        goal.target_date,
        daysBefore
      )

      for (const token of tokens) {
        if (existingKeys.has(`${goal.id}|${scheduledAtStr}|${token}`)) continue
        allRows.push({
          user_id: goal.user_id,
          record_id: null,
          goal_id: goal.id,
          token,
          title,
          body,
          scheduled_at: scheduledAtStr,
          status: 'pending',
          notification_type: 'goal_deadline',
        })
      }
    }

    if (allRows.length === 0) {
      console.log('Nothing to schedule (no tokens, or all already scheduled)')
      return new Response(
        JSON.stringify({
          success: true,
          scheduled_count: 0,
          goals_due: targetGoals.length,
          goals_checked: goalsList.length,
          today: todayKSTStr,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 7. 배치 insert
    for (let i = 0; i < allRows.length; i += BATCH_INSERT_SIZE) {
      const chunk = allRows.slice(i, i + BATCH_INSERT_SIZE)
      const { error: insertError } = await supabase
        .from('scheduled_notifications')
        .insert(chunk)

      if (insertError) {
        console.error('Error inserting goal notifications:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to insert goal notifications' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(
      `Scheduled ${allRows.length} goal deadline notifications for ${targetGoals.length} goals (today=${todayKSTStr})`
    )

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_count: allRows.length,
        goals_due: targetGoals.length,
        goals_checked: goalsList.length,
        today: todayKSTStr,
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
