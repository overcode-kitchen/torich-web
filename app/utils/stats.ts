import { PaymentHistoryMap } from '@/app/hooks/payment/usePaymentHistory'
import { isPaymentCompleted } from './payment-completion'

export interface PaymentEvent {
  investmentId: string
  year: number
  month: number
  day: number
  yearMonth: string
  monthlyAmount: number
  title: string
  unitType?: 'amount' | 'shares'
  monthlyShares?: number | null
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
    period_years: number | null
    start_date?: string | null
    created_at: string
    unit_type?: 'amount' | 'shares'
    monthly_shares?: number | null
  }>,
  year: number,
  month: number
): PaymentEvent[] {
  const events: PaymentEvent[] = []
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`

  for (const inv of investments) {
    const startDate = inv.start_date ? new Date(inv.start_date) : new Date(inv.created_at)
    // 적립형(period_years null/0)은 만료 없음 → endDate = null
    const endDate = inv.period_years && inv.period_years > 0
      ? (() => {
          const d = new Date(startDate)
          d.setFullYear(d.getFullYear() + inv.period_years!)
          return d
        })()
      : null

    const days = inv.investment_days
    if (!days || days.length === 0) continue

    const daysInMonth = new Date(year, month, 0).getDate()
    for (const day of days) {
      if (day > daysInMonth) continue
      const paymentDate = new Date(year, month - 1, day)
      if (paymentDate < startDate) continue
      if (endDate && paymentDate > endDate) continue
      events.push({
        investmentId: inv.id,
        year,
        month,
        day,
        yearMonth,
        monthlyAmount: inv.monthly_amount,
        title: inv.title,
        unitType: inv.unit_type,
        monthlyShares: inv.monthly_shares ?? null,
      })
    }
  }
  return events.sort((a, b) => a.day - b.day)
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
    period_years: number | null
    start_date?: string | null
    created_at: string
  }>,
  completedPayments: PaymentHistoryMap
): { totalPayment: number; completedPayment: number; progress: number; remainingPayment: number } {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const events = getPaymentEventsForMonth(investments, year, month)
  let totalPayment = 0
  let completedPayment = 0

  for (const e of events) {
    totalPayment += e.monthlyAmount
    if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
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
    period_years: number | null
    start_date?: string | null
    created_at: string
  }>,
  completedPayments: PaymentHistoryMap,
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
      if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
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
    period_years: number | null
    start_date?: string | null
    created_at: string
  }>,
  completedPayments: PaymentHistoryMap,
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
      if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
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
    period_years: number | null
    start_date?: string | null
    created_at: string
  }>,
  completedPayments: PaymentHistoryMap,
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
      if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
        completed++
      }
    }
    const rate = events.length > 0 ? Math.round((completed / events.length) * 100) : 0
    results.push({ yearMonth, monthLabel, total: events.length, completed, rate })

    current.setMonth(current.getMonth() + 1)
  }
  return results
}

export interface MonthlyPaymentDelta {
  thisMonthSum: number
  lastMonthSum: number
  deltaAmount: number
  hasComparison: boolean
}

/**
 * 이번 달 vs 지난 달 납입금 합산 차이.
 * IMPORTANT: 호출자는 반드시 activeRecords (terminated 투자 제외)를 전달해야 한다.
 * auto는 event-based pipeline (`getPaymentEventsForMonth + isPaymentCompleted`),
 * retroactive는 YYYY-MM- prefix-count.
 * 의존: usePaymentHistory.ts의 retroactive 엔트리 포맷 `${yearMonth}-01` (record-month 당 최대 1개).
 */
export function getMonthlyPaymentDelta(
  activeRecords: Array<{
    id: string
    title: string
    monthly_amount: number
    investment_days?: number[] | null
    period_years: number | null
    start_date?: string | null
    created_at: string
  }>,
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  today: Date = new Date()
): MonthlyPaymentDelta {
  const thisYear = today.getFullYear()
  const thisMonth = today.getMonth() + 1
  const lastDate = new Date(thisYear, thisMonth - 2, 1)
  const lastYear = lastDate.getFullYear()
  const lastMonth = lastDate.getMonth() + 1

  const sumForMonth = (year: number, month: number): number => {
    const events = getPaymentEventsForMonth(activeRecords, year, month)
    let auto = 0
    for (const e of events) {
      if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
        auto += e.monthlyAmount
      }
    }
    const prefix = `${year}-${String(month).padStart(2, '0')}-`
    let retro = 0
    for (const r of activeRecords) {
      const dates = retroactivePayments.get(r.id)
      if (!dates) continue
      let hit = false
      for (const d of dates) {
        if (d.startsWith(prefix)) {
          hit = true
          break
        }
      }
      if (hit) retro += r.monthly_amount
    }
    return auto + retro
  }

  const thisMonthSum = sumForMonth(thisYear, thisMonth)
  const lastMonthSum = sumForMonth(lastYear, lastMonth)

  const lastEvents = getPaymentEventsForMonth(activeRecords, lastYear, lastMonth)
  const lastPrefix = `${lastYear}-${String(lastMonth).padStart(2, '0')}-`
  let hasLastRetro = false
  for (const r of activeRecords) {
    const dates = retroactivePayments.get(r.id)
    if (!dates) continue
    for (const d of dates) {
      if (d.startsWith(lastPrefix)) {
        hasLastRetro = true
        break
      }
    }
    if (hasLastRetro) break
  }
  const hasComparison = lastEvents.length > 0 || hasLastRetro

  return {
    thisMonthSum,
    lastMonthSum,
    deltaAmount: thisMonthSum - lastMonthSum,
    hasComparison,
  }
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
    period_years: number | null
    start_date?: string | null
    created_at: string
  }>,
  completedPayments: PaymentHistoryMap,
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
      if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
        total += e.monthlyAmount
      }
    }
    current.setMonth(current.getMonth() + 1)
  }
  return total
}

