'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useGoals } from './useGoals'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import type { Goal, GoalProgress } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'

export interface GoalGroup {
  goal: Goal
  progress: GoalProgress | undefined
  records: Investment[]
}

export interface UseGoalGroupsReturn {
  /** 목적별 그룹 (목적 정렬 순서 유지) */
  groups: GoalGroup[]
  /** goal_id가 없는 투자들 */
  unassignedRecords: Investment[]
  isLoading: boolean
}

/**
 * 홈 목적 그룹 카드용 데이터 모음.
 * - userId는 자체적으로 supabase.auth에서 가져온다 (Dashboard에 props 추가 금지).
 * - records는 prop으로 받는다.
 * - useGoals / useGoalsProgress / usePaymentHistory를 재사용한다.
 */
export function useGoalGroups(records: Investment[]): UseGoalGroupsReturn {
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { goals, isLoading: goalsLoading } = useGoals(userId)
  const { completedPayments, retroactivePayments, isLoading: paymentsLoading } =
    usePaymentHistory()
  const progressMap = useGoalsProgress(
    goals,
    records,
    completedPayments,
    retroactivePayments,
  )

  const groups = useMemo<GoalGroup[]>(() => {
    return goals.map((goal) => ({
      goal,
      progress: progressMap.get(goal.id),
      records: records.filter((r) => r.goal_id === goal.id),
    }))
  }, [goals, progressMap, records])

  const unassignedRecords = useMemo<Investment[]>(
    () => records.filter((r) => !r.goal_id),
    [records],
  )

  return {
    groups,
    unassignedRecords,
    isLoading: goalsLoading || paymentsLoading,
  }
}
