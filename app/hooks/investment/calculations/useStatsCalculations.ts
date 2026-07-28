import { useMemo } from 'react'
import { Investment } from '@/app/types/investment'
import { getThisMonthStats, type ThisMonthStats } from '@/app/utils/stats'
import { getRecordRealizedPrincipal } from '@/app/utils/realized-principal'
import type { Goal } from '@/app/types/goal'
import type { PaymentHistoryMap, CapturedAmountsMap } from '@/app/types/payment'
import type { PostponedPaymentsMap } from '../../payment/usePostponedPayments'

const EMPTY_CAPTURED: CapturedAmountsMap = new Map()

interface UseStatsCalculationsProps {
  records: Investment[]
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  retroactivePayments: PaymentHistoryMap
  /** 이번 달 미룸 처리된 회차 — 예정(분모)에서 제외 */
  postponedPayments: PostponedPaymentsMap
  /** 각 납입의 매수 시점 실제 금액(원). 실현 원금을 현재 금액이 아닌 매수 시점 금액으로 합산 */
  capturedAmounts?: CapturedAmountsMap
  /** 목적(Goal) 목록 — 직접 입력한 '이미 모은 돈'(external_amount) 합산용 */
  goals: Goal[]
}

export interface UseStatsCalculationsReturn {
  /** 지금까지 모은 돈 = 실제 납입 원금 누적(payment_history 기준) + 목적에 직접 입력한 '이미 모은 돈'. 완료분 포함 */
  totalPaidPrincipal: number
  /** 현재 매달 납입 중인 금액 합 (진행 중 기록만; 기간 종료분 제외) */
  totalMonthlyPayment: number
  thisMonth: ThisMonthStats
}

export function useStatsCalculations({
  records,
  activeRecords,
  completedPayments,
  retroactivePayments,
  postponedPayments,
  capturedAmounts = EMPTY_CAPTURED,
  goals,
}: UseStatsCalculationsProps): UseStatsCalculationsReturn {
  const { totalPaidPrincipal, totalMonthlyPayment } = useMemo(() => {
    // "지금까지 모은 돈" = 앱에 기록된 전체 모은 돈.
    // = 실제 납입한 원금(payment_history 기준, 예정치 아님) + 목적에 직접 입력한 '이미 모은 돈'(external_amount).
    // 각 납입은 매수 시점 실제 금액(captured)으로 합산 → 금액 수정해도 과거가 소급 변동하지 않음.
    // 목적 진척 currentValue(= external + 실현 납입)와 같은 기준으로 맞춰 카드 간 금액이 모순되지 않게 한다.
    const realizedPrincipal = records.reduce(
      (sum, record) =>
        sum +
        getRecordRealizedPrincipal(record, completedPayments, retroactivePayments, capturedAmounts),
      0,
    )
    const externalTotal = goals.reduce((sum, g) => sum + (g.external_amount ?? 0), 0)
    // "월 N씩 적립 중"·"이번 달 투자 내역" = 지금 매달 넣고 있는 금액.
    // 기간이 끝난(완료) 기록은 더 이상 납입하지 않으므로 activeRecords만 합산한다.
    // (totalPaidPrincipal은 완료분까지 누적하는 게 맞아 records 전체를 쓰는 것과 대비된다)
    const totalMonthlyPayment = activeRecords.reduce((sum, record) => sum + record.monthly_amount, 0)
    return { totalPaidPrincipal: realizedPrincipal + externalTotal, totalMonthlyPayment }
  }, [records, activeRecords, completedPayments, retroactivePayments, capturedAmounts, goals])

  const thisMonth = useMemo(() => getThisMonthStats(activeRecords, completedPayments, postponedPayments), [activeRecords, completedPayments, postponedPayments])

  return {
    totalPaidPrincipal,
    totalMonthlyPayment,
    thisMonth,
  }
}
