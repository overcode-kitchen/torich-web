import { PaymentHistoryMap } from '@/app/hooks/payment/usePaymentHistory'
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
