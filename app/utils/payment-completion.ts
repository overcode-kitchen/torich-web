import { PaymentHistoryMap } from '@/app/hooks/payment/usePaymentHistory'

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
