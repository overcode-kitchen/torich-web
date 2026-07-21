'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Goal, GoalUpdateInput } from '@/app/types/goal'

export interface UseGoalUpdateReturn {
  updateGoal: (id: string, patch: GoalUpdateInput) => Promise<Goal | null>
  archiveGoal: (id: string) => Promise<void>
  unarchiveGoal: (id: string) => Promise<void>
  isUpdating: boolean
}

/**
 * 목적 수정 + 보관(archive)/복원(unarchive) 처리.
 *
 * 보관은 goals.archived_at 을 SET 하기만 하며 묶인 투자(records.goal_id)는
 * 그대로 유지한다 → 복원 시 목적·투자 연결이 온전히 되살아난다. (완료 목적 정리용)
 * 투자 연결까지 끊는 파괴적 정리가 필요하면 archive_goal RPC / useGoalDelete 를 쓴다.
 * (구버전 앱은 여전히 archive_goal RPC 를 호출하므로 RPC 는 DB 에 유지된다.)
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

  // 보관: archived_at 만 SET. 투자 연결은 유지해 복원 시 온전히 되살아난다.
  const archiveGoal = useCallback(
    async (id: string): Promise<void> => {
      await updateGoal(id, { archived_at: new Date().toISOString() })
    },
    [updateGoal],
  )

  // 복원: 보관 해제. 유지돼 있던 투자 연결이 그대로 다시 노출된다.
  const unarchiveGoal = useCallback(
    async (id: string): Promise<void> => {
      await updateGoal(id, { archived_at: null })
    },
    [updateGoal],
  )

  return { updateGoal, archiveGoal, unarchiveGoal, isUpdating }
}
