import type { PaymentHistoryMap } from '@/app/types/payment'
import { PostponedPaymentsMap } from '@/app/hooks/payment/usePostponedPayments'
import { isPaymentCompleted, isRecordPostponedInMonth } from './payment-completion'

const EMPTY_POSTPONED: PostponedPaymentsMap = new Map()
const EMPTY_HISTORY: PaymentHistoryMap = new Map()

/** 월별 집계 함수들이 공유하는 투자 기록 최소 형태 */
type MonthlyCountable = {
  id: string
  title: string
  monthly_amount: number
  investment_days?: number[] | null
  period_years: number | null
  start_date?: string | null
  created_at: string
}

export interface MonthCompletion {
  /** 예정 건수 (미룬 회차 제외) */
  total: number
  /** 그중 완료된 건수 (자동 체크 + 소급 납입) */
  completed: number
  /** 그 달을 미룬 record 수 — 예정이 전부 미룸이면 total은 0이 된다 */
  postponedRecords: number
}

/**
 * 특정 연/월의 예정·완료 건수.
 *
 * 월별 완료율·이행 히트맵·연속 적립 스트릭이 전부 이 함수 하나를 기준으로 세도록 모아 둔다.
 * (같은 "몇 % 이행"이 화면마다 다른 숫자로 갈리던 것이 통계 탭의 원래 문제였다)
 *
 * - 미룬 회차는 record-월 단위로 예정(분모)에서 제외한다 — 완료율·스트릭을 깎지 않게.
 * - 소급 납입(`is_retroactive`)은 record-월당 1건(`YYYY-MM-01`)이 그 달 전체를 완료로 만든다.
 */
export function countMonthCompletion(
  investments: MonthlyCountable[],
  completedPayments: PaymentHistoryMap,
  year: number,
  month: number,
  postponedPayments: PostponedPaymentsMap = EMPTY_POSTPONED,
  retroactivePayments: PaymentHistoryMap = EMPTY_HISTORY
): MonthCompletion {
  const events = getPaymentEventsForMonth(investments, year, month)
  const postponedIds = new Set<string>()
  let total = 0
  let completed = 0

  for (const e of events) {
    if (isRecordPostponedInMonth(postponedPayments, e.investmentId, year, month)) {
      postponedIds.add(e.investmentId)
      continue
    }
    total++
    const done =
      isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day) ||
      isPaymentCompleted(retroactivePayments, e.investmentId, e.year, e.month, 1)
    if (done) completed++
  }

  return { total, completed, postponedRecords: postponedIds.size }
}

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
  completedPayments: PaymentHistoryMap,
  postponedPayments: PostponedPaymentsMap = EMPTY_POSTPONED
): { totalPayment: number; completedPayment: number; progress: number; remainingPayment: number } {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const events = getPaymentEventsForMonth(investments, year, month)
  let totalPayment = 0
  let completedPayment = 0

  for (const e of events) {
    // 미룬 회차는 '이번 달 할 일'에서 빠진 것 → 예정(분모)에서 제외
    if (isRecordPostponedInMonth(postponedPayments, e.investmentId, e.year, e.month)) continue
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
 * 특정 연/월의 완료 납입 금액 합계 (회전 인사이트의 "지난달 대비" 계산용)
 */
export function getCompletedPaymentForMonth(
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
  year: number,
  month: number
): number {
  const events = getPaymentEventsForMonth(investments, year, month)
  let sum = 0
  for (const e of events) {
    if (isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)) {
      sum += e.monthlyAmount
    }
  }
  return sum
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
  investments: MonthlyCountable[],
  completedPayments: PaymentHistoryMap,
  monthsBack: number,
  postponedPayments: PostponedPaymentsMap = EMPTY_POSTPONED,
  retroactivePayments: PaymentHistoryMap = EMPTY_HISTORY,
  today: Date = new Date()
): Array<{ yearMonth: string; monthLabel: string; total: number; completed: number; rate: number }> {
  const results: Array<{ yearMonth: string; monthLabel: string; total: number; completed: number; rate: number }> = []

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1

    const { total, completed } = countMonthCompletion(
      investments,
      completedPayments,
      year,
      month,
      postponedPayments,
      retroactivePayments
    )
    results.push({
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      monthLabel: `${month}월`,
      total,
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    })
  }
  return results
}

/**
 * 날짜 범위 내 월별 완료율
 */
export function getMonthlyCompletionRatesForRange(
  investments: MonthlyCountable[],
  completedPayments: PaymentHistoryMap,
  fromDate: Date,
  toDate: Date,
  postponedPayments: PostponedPaymentsMap = EMPTY_POSTPONED,
  retroactivePayments: PaymentHistoryMap = EMPTY_HISTORY
): Array<{ yearMonth: string; monthLabel: string; total: number; completed: number; rate: number }> {
  const results: Array<{ yearMonth: string; monthLabel: string; total: number; completed: number; rate: number }> = []
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), 1)

  const current = new Date(from)
  while (current <= to) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1

    const { total, completed } = countMonthCompletion(
      investments,
      completedPayments,
      year,
      month,
      postponedPayments,
      retroactivePayments
    )
    results.push({
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      monthLabel: `${month}월`,
      total,
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    })

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
 * 의존: PaymentHistoryContext의 retroactive 엔트리 포맷 `${yearMonth}-01` (record-month 당 최대 1개).
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

  const current = new Date(from)
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

