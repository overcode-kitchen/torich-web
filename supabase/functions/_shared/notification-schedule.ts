/**
 * 공통 알림 예약 로직.
 * schedule-notification, reschedule-notifications Edge Function에서 재사용.
 */

const KST_OFFSET_HOURS = 9 // KST는 UTC+9

export interface ScheduleRecord {
  id: string
  user_id: string
  title: string
  start_date: string
  period_years: number
  investment_days: number[]
  notification_enabled?: boolean
}

export interface ScheduleUserSettings {
  notification_global_enabled: boolean
  notification_default_time: string
  notification_pre_reminder: string
}

export interface SchedulePushToken {
  token: string
  platform: string
}

export interface ScheduledNotificationRow {
  user_id: string
  record_id: string
  token: string
  title: string
  body: string
  scheduled_at: string
  status: string
  notification_type: string
}

export function kstToUTC(kstDate: Date): Date {
  const utcDate = new Date(kstDate)
  utcDate.setHours(utcDate.getHours() - KST_OFFSET_HOURS)
  return utcDate
}

function addDays(dateStr: string, days: number): Date {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date
}

function addYears(date: Date, years: number): Date {
  const newDate = new Date(date)
  newDate.setFullYear(newDate.getFullYear() + years)
  return newDate
}

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
 */
export function generatePaymentDates(
  startDate: string,
  periodYears: number,
  investmentDays: number[]
): Date[] {
  const dates: Date[] = []
  const start = new Date(startDate)
  const end = addYears(start, periodYears)
  let current = new Date(start)

  while (current < end) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1
    for (const day of investmentDays) {
      if (isValidDate(year, month, day)) {
        dates.push(new Date(year, month - 1, day))
      }
    }
    current.setMonth(current.getMonth() + 1)
  }

  return dates.sort((a, b) => a.getTime() - b.getTime())
}

function setTime(date: Date, timeStr: string): Date {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number)
  const newDate = new Date(date)
  newDate.setHours(hours, minutes, seconds || 0, 0)
  return newDate
}

/**
 * notification_pre_reminder 문자열을 사전 알림 일수로 변환
 */
export function parsePreReminderToDays(preReminder: string): number {
  const s = (preReminder || '').trim().toLowerCase()
  if (s === 'none' || s === 'same_day' || s === '0') return 0
  if (s === '1d' || s === '1') return 1
  if (s === '2d' || s === '2') return 2
  if (s === '3d' || s === '3') return 3
  if (s === '1w' || s === '7') return 7
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? 0 : Math.max(0, n)
}

/**
 * 알림 시각 계산 (KST 기준)
 */
export function calculateScheduledAt(
  paymentDateStr: string,
  preReminder: string,
  defaultTime: string
): Date {
  const preDays = parsePreReminderToDays(preReminder)
  const baseDate = addDays(paymentDateStr, -preDays)
  return setTime(baseDate, defaultTime)
}

/**
 * 한 record에 대한 예약 알림 행 목록 생성.
 * 과거 시각·중복 제외 후 반환.
 */
export function buildNotificationRows(
  record: ScheduleRecord,
  userSettings: ScheduleUserSettings,
  tokens: SchedulePushToken[],
  existingScheduledAts: Set<string>,
  now: Date
): ScheduledNotificationRow[] {
  const { id: recordId, user_id: userId, title, start_date, period_years, investment_days } = record
  const paymentDates = generatePaymentDates(start_date, period_years, investment_days)
  const preDays = parsePreReminderToDays(userSettings.notification_pre_reminder)
  const rows: ScheduledNotificationRow[] = []

  for (const paymentDate of paymentDates) {
    const paymentDateStr = paymentDate.toISOString().split('T')[0]
    const scheduledAtKST = calculateScheduledAt(
      paymentDateStr,
      userSettings.notification_pre_reminder,
      userSettings.notification_default_time
    )
    const scheduledAtUTC = kstToUTC(scheduledAtKST)
    const scheduledAtUTCStr = scheduledAtUTC.toISOString()

    if (scheduledAtUTC <= now) continue
    if (existingScheduledAts.has(scheduledAtUTCStr)) continue

    const bodyText =
      preDays === 0 ? `${title} - 오늘 알림` : `${title} - ${preDays}일 전 알림`

    for (const t of tokens) {
      rows.push({
        user_id: userId,
        record_id: recordId,
        token: t.token,
        title,
        body: bodyText,
        scheduled_at: scheduledAtUTCStr,
        status: 'pending',
        notification_type: 'reminder',
      })
    }
  }

  return rows
}
