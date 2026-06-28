import type { Investment } from '@/app/types/investment'
import type { PaymentHistoryMap, CapturedAmountsMap } from '@/app/hooks/payment/usePaymentHistory'

const EMPTY_CAPTURED: CapturedAmountsMap = new Map()

/**
 * 한 record의 "지금까지 실제로 납입한 원금"(원)을 계산한다.
 *
 * 각 납입을 **매수 시점 실제 금액(captured)** 으로 합산하되, 캡처가 없는 납입
 * (앱 도입 전·소급·캡처 실패)은 그 건만 현재 monthly_amount로 폴백한다.
 *
 * → 나중에 monthly_amount를 수정해도 과거 납입액이 소급해서 바뀌지 않는다.
 * (기존엔 monthly_amount × 납입 횟수라, 금액 수정 시 과거까지 재계산됐다)
 */
export function getRecordRealizedPrincipal(
  record: Investment,
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  capturedAmounts: CapturedAmountsMap = EMPTY_CAPTURED,
): number {
  const fallback = record.monthly_amount > 0 ? record.monthly_amount : 0
  const captured = capturedAmounts.get(record.id)

  let total = 0
  const addDates = (dates: Set<string> | undefined): void => {
    if (!dates) return
    for (const date of dates) {
      const capturedWon = captured?.get(date)
      total += capturedWon != null && capturedWon > 0 ? capturedWon : fallback
    }
  }
  addDates(completedPayments.get(record.id))
  addDates(retroactivePayments.get(record.id))
  return total
}
