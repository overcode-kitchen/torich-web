'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Goal } from '@/app/types/goal'

export interface UseGoalsReturn {
  goals: Goal[]
  archivedGoals: Goal[]
  isLoading: boolean
  refetch: () => Promise<void>
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>
}

/**
 * 사용자 목적 목록을 조회한다.
 * - goals: archived_at IS NULL (활성)
 * - archivedGoals: archived_at IS NOT NULL (보관함)
 * 정렬: target_date ASC (NULL은 맨 뒤). 임박한 목적이 위로.
 */
export function useGoals(userId: string | undefined): UseGoalsReturn {
  const supabase = useMemo(() => createClient(), [])
  const [goals, setGoals] = useState<Goal[]>([])
  const [archivedGoals, setArchivedGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchGoals = useCallback(async (): Promise<void> => {
    if (!userId) {
      setGoals([])
      setArchivedGoals([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('target_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      const all = (data ?? []) as Goal[]
      setGoals(all.filter((g) => g.archived_at === null))
      setArchivedGoals(all.filter((g) => g.archived_at !== null))
    } catch (e) {
      console.error('useGoals fetch failed:', e)
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    void fetchGoals()
  }, [fetchGoals])

  return { goals, archivedGoals, isLoading, refetch: fetchGoals, setGoals }
}
