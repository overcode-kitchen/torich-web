'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Goal, GoalUpdateInput } from '@/app/types/goal'

export interface UseGoalUpdateReturn {
  updateGoal: (id: string, patch: GoalUpdateInput) => Promise<Goal | null>
  archiveGoal: (id: string) => Promise<void>
  isUpdating: boolean
}

/**
 * 목적 수정 + archive(정리) 처리.
 * archive는 archive_goal RPC를 호출해 goals.archived_at SET과
 * records.goal_id NULL을 단일 트랜잭션 내에서 원자적으로 실행한다.
 */
export function useGoalUpdate(userId: string | undefined): UseGoalUpdateReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  const updateGoal = useCallback(
    async (id: string, patch: GoalUpdateInput): Promise<Goal | null> => {
      if (!userId) return null
      setIsUpdating(true)
      try {
        const { data, error } = await supabase
          .from('goals')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId)
          .select('*')
          .single()
        if (error) throw error
        return data as Goal
      } catch (e) {
        console.error('useGoalUpdate failed:', e)
        throw e
      } finally {
        setIsUpdating(false)
      }
    },
    [userId, supabase],
  )

  const archiveGoal = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) return
      setIsUpdating(true)
      try {
        const { error } = await supabase.rpc('archive_goal', { p_goal_id: id })
        if (error) throw error
      } catch (e) {
        console.error('archiveGoal failed:', e)
        throw e
      } finally {
        setIsUpdating(false)
      }
    },
    [userId, supabase],
  )

  return { updateGoal, archiveGoal, isUpdating }
}
