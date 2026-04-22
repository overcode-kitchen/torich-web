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
  /**
   * 목표 기간(년).
   * - number > 0: 목표형(만기까지 알림 예약)
   * - null | 0: 적립형(만기 없음 - HABIT_DEFAULT_YEARS 기준으로 롤링 예약)
   */
  period_years: number | null
  investment_days: number[]
  notification_enabled?: boolean
  /** 월 납입액 (원 단위). 푸시 본문에 사용 */
  monthly_amount?: number
}

/**
 * 적립형(목표 기간 없음) 기본 알림 스케줄 기간
 * 이 기간만큼 미리 알림을 예약해두고, reschedule 잡이 주기적으로 갱신함
 */
export const HABIT_DEFAULT_YEARS = 10

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
 * 적립형(periodYears null/0): HABIT_DEFAULT_YEARS 기간만큼 선예약
 */
export function generatePaymentDates(
  startDate: string,
  periodYears: number | null,
  investmentDays: number[]
): Date[] {
  const dates: Date[] = []
  const start = new Date(startDate)
  const effectivePeriodYears = periodYears && periodYears > 0 ? periodYears : HABIT_DEFAULT_YEARS
  const end = addYears(start, effectivePeriodYears)
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

/** 푸시 본문용 금액 포맷 (원 → "N만원" / "N억 N만원") */
function formatAmountForPush(amountWon: number): string {
  if (typeof amountWon !== 'number' || Number.isNaN(amountWon) || amountWon < 0) return '0원'
  if (amountWon >= 100000000) {
    const eok = Math.floor(amountWon / 100000000)
    const remainder = amountWon % 100000000
    if (remainder >= 10000) {
      const man = Math.floor(remainder / 10000)
      return `${eok}억 ${man}만원`
    }
    return `${eok}억원`
  }
  if (amountWon >= 10000) {
    const man = Math.floor(amountWon / 10000)
    return `${man}만원`
  }
  return `${Math.floor(amountWon).toLocaleString()}원`
}

/** 푸시 본문용 납입일 포맷 (YYYY-MM-DD → "M월 D일") */
function formatPaymentDateForPush(isoDateStr: string): string {
  const [, m, d] = isoDateStr.split('-').map(Number)
  if (!m || !d) return isoDateStr
  return `${m}월 ${d}일`
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
  const { id: recordId, user_id: userId, title, start_date, period_years, investment_days, monthly_amount } = record
  const paymentDates = generatePaymentDates(start_date, period_years, investment_days)
  const preDays = parsePreReminderToDays(userSettings.notification_pre_reminder)
  const rows: ScheduledNotificationRow[] = []

  const pushTitle =
    preDays === 0 ? `오늘 "${title}" 납입일이에요` : `"${title}" 납입일이 ${preDays}일 남았어요`

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

    const paymentDateFormatted = formatPaymentDateForPush(paymentDateStr)
    const amountText = typeof monthly_amount === 'number' ? formatAmountForPush(monthly_amount) : ''
    const bodyText = amountText
      ? preDays === 0
        ? `오늘 ${paymentDateFormatted}이 납입일이에요. ${amountText} 납입 잊지 마세요!`
        : `${preDays}일 뒤인 ${paymentDateFormatted}에 ${amountText} 납입 예정이에요`
      : `${paymentDateFormatted} 납입일을 확인해 주세요`

    for (const t of tokens) {
      rows.push({
        user_id: userId,
        record_id: recordId,
        token: t.token,
        title: pushTitle,
        body: bodyText,
        scheduled_at: scheduledAtUTCStr,
        status: 'pending',
        notification_type: 'reminder',
      })
    }
  }

  return rows
}
