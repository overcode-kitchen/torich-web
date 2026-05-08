'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface UseGoalDeleteReturn {
  deleteGoal: (id: string) => Promise<void>
  isDeleting: boolean
}

/**
 * 목적 영구 삭제.
 * records.goal_id는 ON DELETE SET NULL FK 제약으로 자동 NULL 처리됨.
 * (보통은 archive를 권장. delete는 archived 보관함에서 영구 제거 시 사용.)
 */
export function useGoalDelete(userId: string | undefined): UseGoalDeleteReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const deleteGoal = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) return
      setIsDeleting(true)
      try {
        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
        if (error) throw error
      } catch (e) {
        console.error('useGoalDelete failed:', e)
        throw e
      } finally {
        setIsDeleting(false)
      }
    },
    [userId, supabase],
  )

  return { deleteGoal, isDeleting }
}
