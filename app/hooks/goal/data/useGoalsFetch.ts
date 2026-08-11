'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Goal } from '@/app/types/goal'

export interface UseGoalsFetchReturn {
  refetch: () => Promise<void>
  isLoading: boolean
}

/**
 * 사용자 목적 목록을 조회해 활성/보관으로 나눠 상위 상태에 반영한다.
 * - 활성(goals): archived_at IS NULL
 * - 보관(archivedGoals): archived_at IS NOT NULL
 * 정렬: 쿼리는 target_date ASC(NULL 맨 뒤)로만 받고, 수동 순서(sort_order)는
 *   클라이언트에서 stable sort로 덧씌운다(직접 옮긴 목적 우선, 나머지는 마감 임박순).
 *   → sort_order 컬럼이 아직 없는 구버전 DB에서도 조회가 깨지지 않는다(신앱+구DB 호환).
 *
 * fetch를 별도 훅으로 분리한 이유: 조회 로직을 재사용/격리하고, effect에서 setState를
 *   직접 호출하지 않게 하기 위함이다(useInvestmentsFetch와 동일한 구조).
 */
export function useGoalsFetch(
  userId: string | undefined,
  setGoals: (goals: Goal[]) => void,
  setArchivedGoals: (goals: Goal[]) => void,
): UseGoalsFetchReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refetch = useCallback(async (): Promise<void> => {
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
      // 수동 순서(sort_order)는 클라이언트 stable sort로 덧씌운다. 이미 target_date로
      // 정렬돼 왔으므로, sort_order 없는(=NULL) 목적끼리는 마감 임박순이 그대로 유지된다.
      const all = (data ?? []) as Goal[]
      const ordered = [...all].sort(
        (a, b) =>
          (a.sort_order ?? Number.POSITIVE_INFINITY) -
          (b.sort_order ?? Number.POSITIVE_INFINITY),
      )
      setGoals(ordered.filter((g) => g.archived_at === null))
      setArchivedGoals(ordered.filter((g) => g.archived_at !== null))
    } catch (e) {
      console.error('useGoals fetch failed:', e)
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase, setGoals, setArchivedGoals])

  return { refetch, isLoading }
}
