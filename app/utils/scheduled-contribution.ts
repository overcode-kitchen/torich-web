import { getStartDate, type Investment } from '@/app/types/investment'
import type { PaymentHistoryMap } from '@/app/types/payment'
import { isPaymentCompleted } from '@/app/utils/payment-completion'

/**
 * "예정 회차 금액" 원시 계산 — 어느 달에 이 기록이 얼마를 넣을 예정인가.
 *
 * 창(시작일·만기) 판정과 회차 세는 방식을 `getPaymentEventsForMonth`와 동일하게 맞춘다.
 * 통계의 예정 회차와 도착 예정이 서로 다른 회차 수를 세면 같은 화면에서 숫자가 어긋난다.
 * 다만 도착 예정은 '미래의 아직 없는 달'까지 세야 해서 이벤트 목록이 아닌 금액만 돌려준다.
 */

export interface YearMonth {
  year: number
  /** 1~12 */
  month: number
}

export function monthIndex(ym: YearMonth): number {
  return ym.year * 12 + (ym.month - 1)
}

export function toYearMonth(date: Date): YearMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function addMonths(ym: YearMonth, delta: number): YearMonth {
  const index = monthIndex(ym) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export function firstDayOf(ym: YearMonth): Date {
  return new Date(ym.year, ym.month - 1, 1)
}

/** 적립 기간(period_years)이 끝나는 날. 적립형(기간 없음)은 null */
export function maturityDate(record: Investment): Date | null {
  if (!record.period_years || record.period_years <= 0) return null
  const end = new Date(getStartDate(record))
  end.setFullYear(end.getFullYear() + record.period_years)
  return end
}

export interface ScheduleWindow {
  /** 이 날짜 이후의 회차는 세지 않는다 (목표일까지만 합산할 때 씀). null이면 제한 없음 */
  until: Date | null
  /** 만기·정산을 무시하고 계속 넣는다고 가정 — '적립 기간 종료' 원인 판정에 씀 */
  ignoreEnd: boolean
}

/**
 * 그 달 이 기록의 예정 회차 날짜들.
 * 회차 날짜(investment_days)가 없는 구버전 기록은 월 1회로 본다 — 0회로 보면 도착이 영원히 오지 않는다.
 */
function scheduledDays(record: Investment, ym: YearMonth, window: ScheduleWindow): number[] {
  const start = getStartDate(record)
  const end = window.ignoreEnd ? null : maturityDate(record)
  const daysInMonth = new Date(ym.year, ym.month, 0).getDate()
  const days = record.investment_days?.length
    ? record.investment_days
    : [Math.min(start.getDate(), daysInMonth)]

  const hit: number[] = []
  for (const day of days) {
    if (day > daysInMonth) continue
    const date = new Date(ym.year, ym.month - 1, day)
    if (date < start) continue
    if (end && date > end) continue
    if (window.until && date > window.until) continue
    hit.push(day)
  }
  return hit
}

/** 그 달 이 기록이 넣을 예정 금액. 정산된 기록은 미래 기여가 0이다 */
export function scheduledAmount(
  record: Investment,
  ym: YearMonth,
  window: ScheduleWindow,
): number {
  if (!record.monthly_amount || record.monthly_amount <= 0) return 0
  if (record.settled_at && !window.ignoreEnd) return 0
  return scheduledDays(record, ym, window).length * record.monthly_amount
}

/**
 * 그 달 예정 회차 중 아직 체크하지 않은 금액.
 * 이번 달은 이미 체크한 회차가 현재 금액(currentValue)에 들어 있어, 그대로 더하면 두 번 세진다.
 */
export function unpaidAmount(
  record: Investment,
  ym: YearMonth,
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  window: ScheduleWindow,
): number {
  if (!record.monthly_amount || record.monthly_amount <= 0) return 0
  if (record.settled_at) return 0
  // 소급 납입은 record-월당 1건(YYYY-MM-01)이 그 달 전체를 완료로 만든다
  if (isPaymentCompleted(retroactivePayments, record.id, ym.year, ym.month, 1)) return 0

  let count = 0
  for (const day of scheduledDays(record, ym, window)) {
    if (isPaymentCompleted(completedPayments, record.id, ym.year, ym.month, day)) continue
    count++
  }
  return count * record.monthly_amount
}

/** 묶인 기록 중 가장 이른 시작 월. 기록이 없으면 null */
export function earliestStartMonth(records: Investment[]): YearMonth | null {
  let earliest: YearMonth | null = null
  for (const record of records) {
    const ym = toYearMonth(getStartDate(record))
    if (!earliest || monthIndex(ym) < monthIndex(earliest)) earliest = ym
  }
  return earliest
}

/** 목표일 전에 적립이 끊기는 가장 이른 시점(만기 또는 정산). 끊기지 않으면 null */
export function earliestFundingEnd(records: Investment[], targetDate: Date): Date | null {
  let earliest: Date | null = null
  for (const record of records) {
    if (!record.monthly_amount || record.monthly_amount <= 0) continue
    const end = record.settled_at ? new Date(record.settled_at) : maturityDate(record)
    if (!end || end >= targetDate) continue
    if (!earliest || end < earliest) earliest = end
  }
  return earliest
}
