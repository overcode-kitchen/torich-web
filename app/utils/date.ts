import { differenceInMonths, addMonths, addDays, differenceInDays, format, isBefore, isAfter } from 'date-fns'

/**
 * 개월 수를 "X년 Y개월" 형태의 문자열로 변환
 * - 개월 수가 0이면 생략 (예: "1년 0개월" -> "1년")
 * - 년도가 0이면 생략 (예: "0년 10개월" -> "10개월")
 */
export function formatDuration(totalMonths: number): string {
  const absMonths = Math.abs(totalMonths)
  const years = Math.floor(absMonths / 12)
  const months = absMonths % 12

  if (years === 0 && months === 0) {
    return '0개월'
  }

  const parts: string[] = []
  if (years > 0) {
    parts.push(`${years}년`)
  }
  if (months > 0) {
    parts.push(`${months}개월`)
  }

  return parts.join(' ')
}

/**
 * 시작일과 목표 기간(년)을 기반으로 종료일 계산
 * 적립형(periodYears null/0)은 종료일이 없으므로 null 반환.
 */
export function calculateEndDate(startDate: Date, periodYears: number | null | undefined): Date | null {
  if (!periodYears || periodYears <= 0) return null
  return addMonths(startDate, periodYears * 12)
}

/**
 * 남은 기간 계산 (오늘 기준 종료일까지)
 * @returns 남은 개월 수 (음수면 이미 지남)
 */
export function getRemainingMonths(endDate: Date): number {
  const today = new Date()
  return differenceInMonths(endDate, today)
}

/**
 * 경과된 기간 계산 (시작일부터 오늘까지)
 * @returns 경과 개월 수
 */
export function getElapsedMonths(startDate: Date): number {
  const today = new Date()
  return differenceInMonths(today, startDate)
}

/**
 * 진행률 계산 (0 ~ 100)
 * 적립형은 "진행률" 개념이 없으므로 null 반환.
 * @param startDate 시작일
 * @param periodYears 목표 기간(년)
 */
export function calculateProgress(startDate: Date, periodYears: number | null | undefined): number | null {
  if (!periodYears || periodYears <= 0) return null
  const totalMonths = periodYears * 12
  const elapsedMonths = getElapsedMonths(startDate)

  if (elapsedMonths <= 0) return 0
  if (elapsedMonths >= totalMonths) return 100

  return Math.round((elapsedMonths / totalMonths) * 100)
}

/**
 * 남은 기간 텍스트 생성
 * - 목표형 + 남음: "X년 Y개월 남음"
 * - 목표형 + 지남: "목표 달성! 🎉"
 * - 적립형: null (호출측에서 elapsed 텍스트로 대체)
 */
export function getRemainingText(startDate: Date, periodYears: number | null | undefined): string | null {
  const endDate = calculateEndDate(startDate, periodYears)
  if (!endDate) return null

  const remainingMonths = getRemainingMonths(endDate)

  if (remainingMonths <= 0) {
    return '목표 달성! 🎉'
  }

  return `${formatDuration(remainingMonths)} 남음`
}

/**
 * 적립형: "N개월째 적립 중 🔥" 형태의 streak 텍스트
 */
export function getHabitStreakText(startDate: Date): string {
  const elapsedMonths = getElapsedMonths(startDate)
  if (elapsedMonths <= 0) return '이번 달부터 적립 시작 🔥'
  return `${formatDuration(elapsedMonths)}째 적립 중 🔥`
}

/**
 * 진행 기간 텍스트 생성
 * - "X년 Y개월째 도전 중 🔥"
 */
export function getElapsedText(startDate: Date): string {
  const elapsedMonths = getElapsedMonths(startDate)
  
  if (elapsedMonths <= 0) {
    return '막 시작했어요! 🚀'
  }
  
  return `${formatDuration(elapsedMonths)}째 도전 중 🔥`
}

/**
 * 날짜를 YYYY.MM 형식으로 포맷
 */
export function formatYearMonth(date: Date): string {
  return format(date, 'yyyy.MM')
}

/**
 * 날짜를 YYYY.MM.DD 형식으로 포맷
 */
export function formatFullDate(date: Date): string {
  return format(date, 'yyyy.MM.dd')
}

/**
 * 목표 기간이 완료되었는지 확인
 * 적립형(periodYears 없음)은 완료 개념이 없으므로 항상 false.
 */
export function isCompleted(startDate: Date, periodYears: number | null | undefined): boolean {
  const endDate = calculateEndDate(startDate, periodYears)
  if (!endDate) return false
  return isAfter(new Date(), endDate)
}

/** 오늘 00:00:00 기준 Date */
function startOfToday(): Date {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}

/**
 * 다음 결제일까지 남은 일수 (D-Day)
 * @param investment_days 매월 투자일 [5, 25]
 * @returns 남은 일수 (0이면 오늘이 결제일, null이면 investment_days 미설정)
 */
export function getDaysUntilNextPayment(investment_days?: number[]): number | null {
  if (!investment_days || investment_days.length === 0) return null
  const today = startOfToday()
  const year = today.getFullYear()
  const month = today.getMonth()
  const currentDay = today.getDate()

  const sortedDays = [...investment_days].sort((a, b) => a - b)
  for (const day of sortedDays) {
    if (day > currentDay) {
      const nextDate = new Date(year, month, day)
      return differenceInDays(nextDate, today)
    }
  }
  // 다음 달 첫 결제일
  const nextMonthFirst = sortedDays[0]
  const nextDate = new Date(year, month + 1, nextMonthFirst)
  return differenceInDays(nextDate, today)
}

/**
 * N일 이내 결제일 목록 (investment, paymentDate, amount)[]
 * @param withinDays 1=오늘만, 7=오늘 포함 7일, 365=1년 등
 */
export function getUpcomingPayments(
  items: Array<{ id: string; investment_days?: number[]; monthly_amount: number }>,
  withinDays: number = 7
): Array<{ id: string; paymentDate: Date; monthly_amount: number; dayOfMonth: number }> {
  const today = startOfToday()
  const results: Array<{ id: string; paymentDate: Date; monthly_amount: number; dayOfMonth: number }> = []
  const daysToCheck = Math.max(0, withinDays)

  for (const item of items) {
    const days = item.investment_days
    if (!days || days.length === 0) continue

    for (let d = 0; d < daysToCheck; d++) {
      const checkDate = addDays(today, d)
      const dayOfMonth = checkDate.getDate()
      if (days.includes(dayOfMonth)) {
        results.push({
          id: item.id,
          paymentDate: checkDate,
          monthly_amount: item.monthly_amount,
          dayOfMonth,
        })
      }
    }
  }
  return results.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
}

/** 날짜 00:00:00 기준 */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * 날짜 범위 내 결제일 목록
 * @param fromDate 시작일 (포함)
 * @param toDate 종료일 (포함)
 */
export function getUpcomingPaymentsInRange(
  items: Array<{ id: string; investment_days?: number[]; monthly_amount: number }>,
  fromDate: Date,
  toDate: Date
): Array<{ id: string; paymentDate: Date; monthly_amount: number; dayOfMonth: number }> {
  const from = startOfDay(fromDate)
  const to = startOfDay(toDate)
  const daysToCheck = Math.max(0, differenceInDays(to, from) + 1)
  const results: Array<{ id: string; paymentDate: Date; monthly_amount: number; dayOfMonth: number }> = []

  for (const item of items) {
    const days = item.investment_days
    if (!days || days.length === 0) continue

    for (let d = 0; d < daysToCheck; d++) {
      const checkDate = addDays(from, d)
      if (checkDate > to) break
      const dayOfMonth = checkDate.getDate()
      if (days.includes(dayOfMonth)) {
        results.push({
          id: item.id,
          paymentDate: checkDate,
          monthly_amount: item.monthly_amount,
          dayOfMonth,
        })
      }
    }
  }
  return results.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
}

/**
 * 다음 결제일 Date 반환
 * @param investment_days 매월 투자일 [5, 25]
 * @returns 다음 결제일 Date (null이면 investment_days 미설정)
 */
export function getNextPaymentDate(investment_days?: number[]): Date | null {
  if (!investment_days || investment_days.length === 0) return null
  const today = startOfToday()
  const year = today.getFullYear()
  const month = today.getMonth()
  const currentDay = today.getDate()
  const sortedDays = [...investment_days].sort((a, b) => a - b)
  for (const day of sortedDays) {
    if (day > currentDay) {
      return new Date(year, month, day)
    }
  }
  const nextMonthFirst = sortedDays[0]
  return new Date(year, month + 1, nextMonthFirst)
}

/**
 * 다음 결제일을 "M/d" 형식으로 포맷 (예: "2/25")
 */
export function formatNextPaymentDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}
/**
 * 결제일을 "M/d (요일)" 형식으로 포맷 (예: "2/5 (수)")
 */
export function formatPaymentDateShort(date: Date): string {
  const m = date.getMonth() + 1
  const d = date.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const w = weekdays[date.getDay()]
  return `${m}/${d} (${w})`
}
