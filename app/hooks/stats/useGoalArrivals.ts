'use client'

import { useMemo } from 'react'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import type { PostponedPaymentsMap } from '@/app/hooks/payment/usePostponedPayments'
import type { Goal } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'
import type { CapturedAmountsMap, PaymentHistoryMap } from '@/app/types/payment'
import { buildGoalArrival, type DatedGoal, type GoalArrival } from '@/app/utils/goal-arrival'
import { hasArrivalEstimate } from '@/app/utils/goal-scope'

interface UseGoalArrivalsProps {
  goals: Goal[]
  records: Investment[]
  completedPayments: PaymentHistoryMap
  retroactivePayments: PaymentHistoryMap
  capturedAmounts: CapturedAmountsMap
  postponedPayments: PostponedPaymentsMap
}

/**
 * 기한 있는 목적들의 도착 예정 — 마감 임박순(target_date 오름차순).
 *
 * 도착 예정 hero와 목표별 페이스가 같은 목록을 나눠 쓰기 때문에 계산을 여기 한 곳에 모은다.
 * 두 카드가 각자 목적을 걸러 계산하면 hero에 올라간 목적이 아래에 또 나오거나(중복),
 * 같은 목적의 도착 예정이 카드마다 다른 달로 갈릴 수 있다.
 *
 * 정렬은 통계 탭 공통 기준인 마감 임박순 — 홈(사용자가 정한 sort_order)과 역할을 갈라 둔다.
 */
export function useGoalArrivals({
  goals,
  records,
  completedPayments,
  retroactivePayments,
  capturedAmounts,
  postponedPayments,
}: UseGoalArrivalsProps): GoalArrival[] {
  const datedGoals = useMemo(
    () =>
      goals
        .filter((g): g is DatedGoal => g.completed_at === null && hasArrivalEstimate(g))
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()),
    [goals],
  )

  const progressMap = useGoalsProgress(
    datedGoals,
    records,
    completedPayments,
    retroactivePayments,
    capturedAmounts,
  )

  return useMemo(() => {
    const arrivals: GoalArrival[] = []
    for (const goal of datedGoals) {
      const progress = progressMap.get(goal.id)
      if (!progress) continue
      arrivals.push(
        buildGoalArrival(
          goal,
          progress,
          records.filter((r) => r.goal_id === goal.id),
          completedPayments,
          retroactivePayments,
          postponedPayments,
        ),
      )
    }
    return arrivals
  }, [datedGoals, progressMap, records, completedPayments, retroactivePayments, postponedPayments])
}
