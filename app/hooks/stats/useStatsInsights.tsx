import { useMemo, type ReactNode } from 'react'
import { getCompletedPaymentForMonth } from '@/app/utils/stats'
import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'
import type { PaymentHistoryMap } from '@/app/hooks/payment/usePaymentHistory'

interface UseStatsInsightsParams {
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  /** 이번 달 완료 적립액 (지난달 대비 증가분 계산용) */
  thisMonthCompleted: number
}

/**
 * 이행 Hero 서브라인용 "칭찬" 인사이트 목록.
 * - 헤드라인(이번 달 적립액)과 시간축을 맞춰 이번 달 vs 지난달 비교만 노출
 * - "지난달보다 더"는 양수일 때만 (음수는 의욕을 꺾어 과거에 제거된 이력 → 양수 가드 필수)
 */
export function useStatsInsights({
  activeRecords,
  completedPayments,
  thisMonthCompleted,
}: UseStatsInsightsParams): ReactNode[] {
  return useMemo(() => {
    const items: ReactNode[] = []

    // 지난달 대비 더 모음 — 양수일 때만 (이번 달 vs 지난달, 헤드라인 적립액과 시간축 일치)
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthCompleted = getCompletedPaymentForMonth(
      activeRecords,
      completedPayments,
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1
    )
    const delta = thisMonthCompleted - lastMonthCompleted
    if (delta > 0) {
      items.push(
        <>
          지난달보다 <span className="font-semibold text-primary">{formatCurrency(delta)}</span> 더 모았어요
        </>
      )
    }

    return items
  }, [activeRecords, completedPayments, thisMonthCompleted])
}
