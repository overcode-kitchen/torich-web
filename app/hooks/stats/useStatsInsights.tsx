import { useMemo, type ReactNode } from 'react'
import Image from 'next/image'
import { getCompletedPaymentForMonth } from '@/app/utils/stats'
import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'
import type { PaymentHistoryMap } from '@/app/types/payment'
import type { ConsistencyInsight } from '@/app/hooks/chart/useChartData'

interface UseStatsInsightsParams {
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  /** 소급 납입 — 누적 적립 완료 횟수에 함께 포함 */
  retroactivePayments: PaymentHistoryMap
  /** 이번 달 완료 적립액 (지난달 대비 증가분 계산용) */
  thisMonthCompleted: number
  /** 꾸준함 집계 — 첫 100% 달성 판정에 사용 */
  consistency: ConsistencyInsight | null
}

/**
 * 이행 Hero 서브라인용 "칭찬" 인사이트 목록 (회전 노출 — 한 번에 하나씩 번갈아).
 * 특별한 순간(첫 100%) → 누적 성취(적립 완료 횟수) → 이번 달 격려(지난달 대비) 순으로 쌓는다.
 * 모두 비판 없는 격려 톤이며, 음수/0 같은 의욕을 꺾는 값은 애초에 넣지 않는다.
 */
export function useStatsInsights({
  activeRecords,
  completedPayments,
  retroactivePayments,
  thisMonthCompleted,
  consistency,
}: UseStatsInsightsParams): ReactNode[] {
  return useMemo(() => {
    const items: ReactNode[] = []

    // 첫 100% 달성 — 100% 채운 달이 처음 생겼을 때만(특별한 순간). 두 번째부터는 추세 카드의 스트릭이 이어받는다.
    if (consistency?.perfectMonths === 1) {
      items.push(<>🎉 처음으로 한 달 적립을 모두 완료했어요</>)
    }

    // 누적 적립 완료 횟수 — 자동+소급 체크 건수의 합(건 단위). 매달 늘어나는 것 자체가 꾸준함 보상.
    let totalCompleted = 0
    for (const set of completedPayments.values()) totalCompleted += set.size
    for (const set of retroactivePayments.values()) totalCompleted += set.size
    if (totalCompleted > 0) {
      items.push(
        <>
          <span className="relative mr-1 inline-block h-5 w-5 align-text-bottom">
            <Image src="/icons/3d/acorn-1.png" alt="" fill className="object-contain" />
          </span>
          지금까지 <span className="font-semibold text-primary">{totalCompleted}번</span> 적립 완료했어요
        </>
      )
    }

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
  }, [activeRecords, completedPayments, retroactivePayments, thisMonthCompleted, consistency])
}
