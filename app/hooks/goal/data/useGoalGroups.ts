'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useGoals } from './useGoals'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import type { Goal, GoalProgress } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'
import { deriveGoalStatus, type GoalStatus } from '@/app/utils/goal-status'

export interface GoalGroup {
  goal: Goal
  progress: GoalProgress | undefined
  records: Investment[]
  /** 파생 상태: 진행 중 / 정산 대기 / 완료. 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md */
  status: GoalStatus
}

export interface UseGoalGroupsReturn {
  /** 목적별 그룹 (목적 정렬 순서 유지) */
  groups: GoalGroup[]
  /** goal_id가 없는 투자들 */
  unassignedRecords: Investment[]
  isLoading: boolean
  /** 현재 사용자 id (홈에서 보관 등 mutation 훅에 넘기기 위함) */
  userId: string | undefined
  /** 목적 목록 재조회 (보관 후 홈 카드 갱신용) */
  refetch: () => Promise<void>
  /** 목적 목록 로컬 갱신 (드래그 순서 변경 낙관적 반영용) */
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>
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

  const { goals, isLoading: goalsLoading, refetch, setGoals } = useGoals(userId)
  const { completedPayments, retroactivePayments, capturedAmounts, isLoading: paymentsLoading } =
    usePaymentHistory()
  const progressMap = useGoalsProgress(
    goals,
    records,
    completedPayments,
    retroactivePayments,
    capturedAmounts,
  )

  const groups = useMemo<GoalGroup[]>(() => {
    const now = new Date()
    return goals.map((goal) => {
      const linkedRecords = records.filter((r) => r.goal_id === goal.id)
      const progress = progressMap.get(goal.id)
      const status = deriveGoalStatus({
        goal,
        linkedRecords,
        accumulatedAmount: progress?.currentValue ?? 0,
        now,
      })
      return {
        goal,
        progress,
        records: linkedRecords,
        status,
      }
    })
  }, [goals, progressMap, records])

  const unassignedRecords = useMemo<Investment[]>(
    () => records.filter((r) => !r.goal_id),
    [records],
  )

  return {
    groups,
    unassignedRecords,
    isLoading: goalsLoading || paymentsLoading,
    userId,
    refetch,
    setGoals,
  }
}
