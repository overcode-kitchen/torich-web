'use client'

import { useEffect, useState } from 'react'
import type { Goal } from '@/app/types/goal'
import { useGoalsFetch } from './useGoalsFetch'

export interface UseGoalsReturn {
  goals: Goal[]
  archivedGoals: Goal[]
  isLoading: boolean
  refetch: () => Promise<void>
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>
}

/**
 * 사용자 목적 목록을 조회한다.
 * 조회 로직은 useGoalsFetch로 분리했고, 여기서는 상태 보관과 최초 조회만 담당한다.
 */
export function useGoals(userId: string | undefined): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([])
  const [archivedGoals, setArchivedGoals] = useState<Goal[]>([])

  const { refetch, isLoading } = useGoalsFetch(userId, setGoals, setArchivedGoals)

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { goals, archivedGoals, isLoading, refetch, setGoals }
}
