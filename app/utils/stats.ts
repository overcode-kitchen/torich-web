const STORAGE_PREFIX = 'torich_completed_'

export interface PaymentEvent {
  investmentId: string
  year: number
  month: number
  day: number
  yearMonth: string
  monthlyAmount: number
  title: string
}

/**
 * 특정 월의 모든 납입 이벤트 목록 (진행 중인 투자만)
 */
export function getPaymentEventsForMonth(
  investments: Array<{
    id: string
    title: string
    monthly_amount: number
    investment_days?: number[] | null
    period_years: number
    start_date?: string | null
    created_at: string
  }>,
  year: number,
  month: number
): PaymentEvent[] {
  const events: PaymentEvent[] = []
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`

  for (const inv of investments) {
    const startDate = inv.start_date ? new Date(inv.start_date) : new Date(inv.created_at)
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + inv.period_years)

    const days = inv.investment_days
    if (!days || days.length === 0) continue

    const daysInMonth = new Date(year, month, 0).getDate()
    for (const day of days) {
      if (day > daysInMonth) continue
      const paymentDate = new Date(year, month - 1, day)
      if (paymentDate < startDate) continue
      if (paymentDate > endDate) continue
      events.push({
        investmentId: inv.id,
        year,
        month,
        day,
        yearMonth,
        monthlyAmount: inv.monthly_amount,
        title: inv.title,
      })
    }
  }
  return events.sort((a, b) => a.day - b.day)
}

/**
 * localStorage에서 해당 납입 완료 여부 확인
 * 키: torich_completed_{investmentId}_{YYYY-MM}_{day}
 * 값: "1" 또는 ISO datetime (둘 다 완료로 간주)
 */
export function isPaymentEventCompleted(
  investmentId: string,
  year: number,
  month: number,
  day: number
): boolean {
  if (typeof window === 'undefined') return false
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`
  const key = `${STORAGE_PREFIX}${investmentId}_${yearMonth}_${day}`
  const val = localStorage.getItem(key)
  return !!val
}

/**
 * 이번 달 납입 현황 (총 금액, 완료 금액, 진행률, 남은 금액)
 */
export function getThisMonthStats(
  investments: Array<{
    id: string
    title: string
    monthly_amount: number
    investment_days?: number[] | null
    period_years: number
    start_date?: string | null
    created_at: string
  }>
): { totalPayment: number; completedPayment: number; progress: number; remainingPayment: number } {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const events = getPaymentEventsForMonth(investments, year, month)
  let totalPayment = 0
  let completedPayment = 0

  for (const e of events) {
    totalPayment += e.monthlyAmount
    if (isPaymentEventCompleted(e.investmentId, e.year, e.month, e.day)) {
      completedPayment += e.monthlyAmount
    }
  }

  const progress = totalPayment > 0 ? Math.round((completedPayment / totalPayment) * 100) : 0
  const remainingPayment = totalPayment - completedPayment

  return { totalPayment, completedPayment, progress, remainingPayment }
}

/**
 * 최근 N개월 총 납입 금액 (완료된 건만)
 */
export function getPeriodTotalPaid(
  investments: Array<{
    id: string
    title: string
    monthly_amount: number
    investment_days?: number[] | null
    period_years: number
    start_date?: string | null
    created_at: string
  }>,
  monthsBack: number
): number {
  const today = new Date()
  let total = 0

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1

    const events = getPaymentEventsForMonth(investments, year, month)
    for (const e of events) {
      if (isPaymentEventCompleted(e.investmentId, e.year, e.month, e.day)) {
        total += e.monthlyAmount
      }
    }
  }
  return total
}

/**
 * 월별 완료율 (최근 N개월)
 * @param monthsBack 최근 몇 개월 (1=이번달만, 3=최근 3개월 등)
 */
export function getMonthlyCompletionRates(
  investments: Array<{
    id: string
    title: string
    monthly_amount: number
    investment_days?: number[] | null
    period_years: number
    start_date?: string | null
    created_at: string
  }>,
  monthsBack: number
): Array<{ yearMonth: string; monthLabel: string; total: number; completed: number; rate: number }> {
  const today = new Date()
  const results: Array<{ yearMonth: string; monthLabel: string; total: number; completed: number; rate: number }> = []

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`
    const monthLabel = `${month}월`

    const events = getPaymentEventsForMonth(investments, year, month)
    let completed = 0
    for (const e of events) {
      if (isPaymentEventCompleted(e.investmentId, e.year, e.month, e.day)) {
        completed++
      }
    }
    const rate = events.length > 0 ? Math.round((completed / events.length) * 100) : 0
    results.push({
      yearMonth,
      monthLabel,
      total: events.length,
      completed,
      rate,
    })
  }
  return results
}

/**
 * 날짜 범위 내 월별 완료율
 */
export function getMonthlyCompletionRatesForRange(
  investments: Array<{
    id: string
    title: string
    monthly_amount: number
    investment_days?: number[] | null
    period_years: number
    start_date?: string | null
    created_at: string
  }>,
  fromDate: Date,
  toDate: Date
): Array<{ yearMonth: string; monthLabel: string; total: number; completed: number; rate: number }> {
  const results: Array<{ yearMonth: string; monthLabel: string; total: number; completed: number; rate: number }> = []
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), 1)

  let current = new Date(from)
  while (current <= to) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`
    const monthLabel = `${month}월`

    const events = getPaymentEventsForMonth(investments, year, month)
    let completed = 0
    for (const e of events) {
      if (isPaymentEventCompleted(e.investmentId, e.year, e.month, e.day)) {
        completed++
      }
    }
    const rate = events.length > 0 ? Math.round((completed / events.length) * 100) : 0
    results.push({ yearMonth, monthLabel, total: events.length, completed, rate })

    current.setMonth(current.getMonth() + 1)
  }
  return results
}

/**
 * 날짜 범위 내 총 납입 금액 (완료된 건만)
 */
export function getPeriodTotalPaidForRange(
  investments: Array<{
    id: string
    title: string
    monthly_amount: number
    investment_days?: number[] | null
    period_years: number
    start_date?: string | null
    created_at: string
  }>,
  fromDate: Date,
  toDate: Date
): number {
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), 1)
  let total = 0

  let current = new Date(from)
  while (current <= to) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1

    const events = getPaymentEventsForMonth(investments, year, month)
    for (const e of events) {
      if (isPaymentEventCompleted(e.investmentId, e.year, e.month, e.day)) {
        total += e.monthlyAmount
      }
    }
    current.setMonth(current.getMonth() + 1)
  }
  return total
}

