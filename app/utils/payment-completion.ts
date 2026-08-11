import type { PaymentHistoryMap } from '@/app/types/payment'
import { PostponedPaymentsMap } from '@/app/hooks/payment/usePostponedPayments'

export function isPaymentCompleted(
  completedPayments: PaymentHistoryMap,
  investmentId: string,
  year: number,
  month: number,
  day: number
): boolean {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return completedPayments.get(investmentId)?.has(dateStr) ?? false
}

/** isPaymentCompleted와 동일 시그니처. 미룸(postpone) 여부 판정. */
export function isPaymentPostponed(
  postponedPayments: PostponedPaymentsMap,
  investmentId: string,
  year: number,
  month: number,
  day: number
): boolean {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return postponedPayments.get(investmentId)?.has(dateStr) ?? false
}

/**
 * 해당 record가 특정 연/월에 미룸 처리됐는지 (날짜 무관, 월 단위).
 * 홈 체크리스트(useMonthlyPaymentStatus)가 record당 이번 달 1회로 미룸을 다루는 것과 동일 기준 —
 * 통계 분모(예정 건수) 계산 시 미룬 회차를 record-월 단위로 제외하기 위해 사용한다.
 */
export function isRecordPostponedInMonth(
  postponedPayments: PostponedPaymentsMap,
  investmentId: string,
  year: number,
  month: number
): boolean {
  const dates = postponedPayments.get(investmentId)
  if (!dates) return false
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  for (const d of dates) {
    if (d.startsWith(prefix)) return true
  }
  return false
}
