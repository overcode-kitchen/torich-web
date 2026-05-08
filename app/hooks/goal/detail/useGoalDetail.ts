'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Goal } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'

export interface UseGoalDetailReturn {
  goal: Goal | null
  records: Investment[]
  unlinkedRecords: Investment[]
  isLoading: boolean
  refetch: () => Promise<void>
  setGoal: React.Dispatch<React.SetStateAction<Goal | null>>
}

/**
 * 목적 detail 페이지용 fetch.
 * - goal 1건
 * - records: 이 goal에 묶인 records
 * - unlinkedRecords: goal_id == null인 records (이 목적에 새로 묶을 수 있는 후보)
 */
export function useGoalDetail(
  id: string | undefined,
  userId: string | undefined,
): UseGoalDetailReturn {
  const supabase = useMemo(() => createClient(), [])
  const [goal, setGoal] = useState<Goal | null>(null)
  const [records, setRecords] = useState<Investment[]>([])
  const [unlinkedRecords, setUnlinkedRecords] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchAll = useCallback(async (): Promise<void> => {
    if (!id || !userId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const goalRes = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
      if (goalRes.error) throw goalRes.error
      setGoal(goalRes.data as Goal)

      const recRes = await supabase
        .from('records')
        .select('*')
        .eq('user_id', userId)
      if (recRes.error) throw recRes.error
      const all = (recRes.data ?? []) as Investment[]
      setRecords(all.filter((r) => r.goal_id === id))
      setUnlinkedRecords(all.filter((r) => !r.goal_id))
    } catch (e) {
      console.error('useGoalDetail fetch failed:', e)
    } finally {
      setIsLoading(false)
    }
  }, [id, userId, supabase])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  return {
    goal,
    records,
    unlinkedRecords,
    isLoading,
    refetch: fetchAll,
    setGoal,
  }
}
