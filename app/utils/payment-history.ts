import type { PaymentHistoryMap } from '@/app/types/payment'
import { isPaymentCompleted } from './payment-completion'
import { ymd, monthlyInstallmentDays, installmentDaysInRange } from './monthly-installments'
import type { Investment } from '@/app/types/investment'

/**
 * 해당 투자의 최근 N개월 납입 완료 기록 조회
 * @param investmentId 투자 ID
 * @param completedPayments 완료 여부 맵
 * @param months 최근 몇 개월 (기본 6)
 * @param investment_days 매월 투자일 [5, 25]
 * @param start_date 투자 시작일
 * @param period_years 투자 기간 년수
 */
export function getPaymentHistory(
  investmentId: string,
  completedPayments: PaymentHistoryMap,
  months: number = 6,
  investment_days?: number[] | null,
  start_date?: string | null,
  period_years?: number
): Array<{ yearMonth: string; monthLabel: string; completed: boolean }> {
  // window checks removed as we rely on Map
  if (!investmentId) return []

  const today = new Date()
  const startDate = start_date ? new Date(start_date) : null
  const endDate =
    startDate && period_years
      ? new Date(startDate.getFullYear() + period_years, startDate.getMonth(), startDate.getDate())
      : null

  const results: Array<{ yearMonth: string; monthLabel: string; completed: boolean }> = []

  for (let i = 0; i < months; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`
    const monthLabel = `${month}월`

    const days = investment_days && investment_days.length > 0 ? investment_days : []
    const paymentDatesInRange = installmentDaysInRange(days, year, month, startDate, endDate)

    let completed: boolean
    if (paymentDatesInRange.length === 0) {
      completed = true
    } else {
      completed = paymentDatesInRange.every((day) =>
        isPaymentCompleted(completedPayments, investmentId, year, month, day)
      )
    }

    results.push({ yearMonth, monthLabel, completed })
  }

  return results
}

export interface PaymentHistoryEntry {
  yearMonth: string
  monthLabel: string
  completed: boolean
  isRetroactive: boolean
}

/**
 * 투자 시작일부터 오늘까지 전체 월별 납입 기록 (최신순)
 *
 * @param tracking_start_date 자동 추적 시작일 (보통 created_at). 이 날짜 이전 구간은 isRetroactive=true로 표시된다.
 *   생략 시 start_date와 동일하게 간주 (기존 동작).
 * @param retroactivePayments 소급 납입 완료 맵 (record_id -> Set<YYYY-MM-01>). 소급 구간 완료 판단에 사용.
 */
/**
 * 이 달이 소급 구간인가 — 자동 추적 시작(보통 created_at) 월보다 이전인가.
 *
 * 소급 구간은 자동 추적과 저장 키가 다르다(YYYY-MM-01 + is_retroactive).
 * 캘린더가 이 구간에 자동 키로 기록해 버리면 상세 소급 표에는 보이지 않고,
 * 나중에 상세에서 다시 기록하면 같은 달이 두 벌로 남아 납입액이 두 배가 된다.
 * 그래서 "여기가 소급 구간인가"의 답을 이 함수 하나로 모은다.
 */
export function isRetroactiveMonth(
  year: number,
  month: number,
  start_date?: string | null,
  tracking_start_date?: string | null,
): boolean {
  const today = new Date()
  const startDate = start_date ? new Date(start_date) : today
  const trackingStart = tracking_start_date ? new Date(tracking_start_date) : startDate
  const effectiveTrackingStart = trackingStart < startDate ? startDate : trackingStart
  const trackingStartMonth = new Date(
    effectiveTrackingStart.getFullYear(),
    effectiveTrackingStart.getMonth(),
    1
  )
  return new Date(year, month - 1, 1) < trackingStartMonth
}

export function getPaymentHistoryFromStart(
  investmentId: string,
  completedPayments: PaymentHistoryMap,
  investment_days?: number[] | null,
  start_date?: string | null,
  period_years?: number,
  tracking_start_date?: string | null,
  retroactivePayments?: PaymentHistoryMap
): PaymentHistoryEntry[] {
  if (!investmentId) return []

  const today = new Date()
  const startDate = start_date ? new Date(start_date) : today
  // 계약 종료일. 기간(period_years)이 없으면 끝이 정해지지 않은 것이므로 null이다.
  // 여기에 today를 넣으면 "아직 오지 않은 이번 달 회차"가 "계약이 끝나 존재하지 않는 회차"로
  // 둔갑해, 회차 0개 → completed=true 경로를 타고 미도래 회차가 '완료'로 표시된다.
  // 표에 보여줄 행의 범위는 아래 endLimit이 따로 담당하므로 표시 범위는 달라지지 않는다.
  const endDate =
    startDate && period_years
      ? new Date(startDate.getFullYear() + period_years, startDate.getMonth(), startDate.getDate())
      : null

  const results: PaymentHistoryEntry[] = []
  const days = investment_days && investment_days.length > 0 ? investment_days : []

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const endLimit = endDate && endDate < today ? endDate : today
  const end = new Date(endLimit.getFullYear(), endLimit.getMonth(), 1)
  if (current > end) return []

  while (current <= end) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`
    const monthLabel = `${month}월`

    const isRetroactive = isRetroactiveMonth(year, month, start_date, tracking_start_date)

    let completed: boolean
    if (isRetroactive) {
      // 소급 구간: 수동 기록만 완료로 간주 (YYYY-MM-01 + is_retroactive=true로 별도 저장)
      completed = retroactivePayments
        ? isPaymentCompleted(retroactivePayments, investmentId, year, month, 1)
        : false
    } else {
      const paymentDatesInRange = installmentDaysInRange(days, year, month, startDate, endDate)

      // 회차가 하나도 없는 달(가입 첫 달의 납입일이 시작일보다 앞서거나, 만기 달의 납입일이
      // 종료일을 넘는 경우)은 "밀린 것이 없다"는 뜻이라 완료로 표기한다.
      // 미도래 회차가 여기로 새지 않도록 막는 것은 위 endDate=null 쪽 책임이다.
      if (paymentDatesInRange.length === 0) {
        completed = true
      } else {
        completed = paymentDatesInRange.every((day) =>
          isPaymentCompleted(completedPayments, investmentId, year, month, day)
        )
      }
    }

    results.push({ yearMonth, monthLabel, completed, isRetroactive })
    current.setMonth(current.getMonth() + 1)
  }

  return results.reverse()
}

/**
 * 해당 월의 회차 날짜(YYYY-MM-DD) 중 [시작일, 종료일] 범위 안의 것만 반환.
 * getPaymentHistoryFromStart의 completed 판정과 동일한 범위 규칙을 쓴다(표의 상태와 토글이 일치하도록).
 */
export function toggleableInstallmentDates(
  item: Investment,
  year: number,
  month: number,
): string[] {
  const startRaw = item.start_date ?? item.created_at ?? null
  const startDate = startRaw ? new Date(startRaw) : null
  const endDate =
    startDate && item.period_years
      ? new Date(startDate.getFullYear() + item.period_years, startDate.getMonth(), startDate.getDate())
      : null

  return monthlyInstallmentDays(item.investment_days, year, month)
    .filter((day) => {
      const d = new Date(year, month - 1, day)
      if (startDate && d < startDate) return false
      if (endDate && d > endDate) return false
      return true
    })
    .map((day) => ymd(year, month, day))
}

/**
 * 상세 표에서 그 달의 자동 납입 회차를 통째로 토글한다.
 * - currentCompleted=true(모두 완료 상태) → 완료된 회차를 모두 취소
 * - currentCompleted=false(미완료/부분) → 아직 안 된 회차를 모두 완료
 * 완료/취소는 PaymentHistoryContext의 togglePayment로 이뤄지므로 표·홈·통계가 함께 갱신된다.
 *
 * @returns 실제로 상태를 바꾼 회차 날짜(YYYY-MM-DD) 목록. 되돌리기 토스트가 정확히 이 회차만
 *   원복하도록 쓰인다(부분완료 → 완료로 채운 뒤 되돌려도 원래 부분완료 상태로 복원).
 */
export async function toggleMonthPayments(
  togglePayment: (recordId: string, date: string, currentCompleted: boolean) => Promise<void>,
  completedForRecord: Set<string> | undefined,
  item: Investment,
  yearMonth: string,
  currentCompleted: boolean,
): Promise<string[]> {
  const [y, m] = yearMonth.split('-').map(Number)
  const dates = toggleableInstallmentDates(item, y, m)
  const toggled: string[] = []
  for (const date of dates) {
    const isDone = completedForRecord?.has(date) ?? false
    if (currentCompleted && isDone) {
      await togglePayment(item.id, date, true)
      toggled.push(date)
    } else if (!currentCompleted && !isDone) {
      await togglePayment(item.id, date, false)
      toggled.push(date)
    }
  }
  return toggled
}
