import { useMemo, type ReactNode } from 'react'
import { getCompletedPaymentForMonth } from '@/app/utils/stats'
import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'
import type { PaymentHistoryMap } from '@/app/types/payment'

interface UseStatsInsightsParams {
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  /** 소급 납입 — 누적 적립 완료 횟수에 함께 포함 */
  retroactivePayments: PaymentHistoryMap
  /** 이번 달 완료 적립액 (지난달 대비 증가분 계산용) */
  thisMonthCompleted: number
}

export interface StatsInsights {
  /** 누적 적립 완료 건수(자동+소급) — Hero 헤드라인 주인공. 줄어들지 않는 지표. */
  totalCompleted: number
  /** Hero 서브라인용 회전 칭찬 문구 */
  items: ReactNode[]
}

/**
 * 누적 성취 Hero용 집계 — 헤드라인 숫자(누적 완료 건수)와 서브라인 칭찬 문구를 낸다.
 *
 * 문구는 모두 비판 없는 격려 톤이며, 음수/0처럼 의욕을 꺾는 값은 애초에 넣지 않는다.
 * 기간 필터에 종속된 집계(스트릭·기간 내 100% 개월·최고 기록)는 여기서 다루지 않는다 —
 * 필터가 있는 월별 추세 카드가 담당해야 "어느 기간의 이야기인가"가 화면에서 자명해진다.
 */
export function useStatsInsights({
  activeRecords,
  completedPayments,
  retroactivePayments,
  thisMonthCompleted,
}: UseStatsInsightsParams): StatsInsights {
  return useMemo(() => {
    // 누적 적립 완료 횟수 — 자동+소급 체크 건수의 합(건 단위). 매달 늘어나는 것 자체가 꾸준함 보상.
    let totalCompleted = 0
    for (const set of completedPayments.values()) totalCompleted += set.size
    for (const set of retroactivePayments.values()) totalCompleted += set.size

    const items: ReactNode[] = []

    // 지난달 대비 더 모음 — 양수일 때만. 두 달 비교라 기간 필터와 무관하다.
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

    return { totalCompleted, items }
  }, [activeRecords, completedPayments, retroactivePayments, thisMonthCompleted])
}
