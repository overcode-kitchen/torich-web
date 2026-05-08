'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface UseInvestmentGoalLinkReturn {
  linkRecordToGoal: (recordId: string, goalId: string | null) => Promise<void>
  isLinking: boolean
}

/**
 * 단일 record의 goal_id를 set/null로 업데이트하는 가벼운 훅.
 * useInvestmentsUpdate.validColumns에 'goal_id'가 추가되어 있어 안전.
 */
export function useInvestmentGoalLink(
  userId: string | undefined,
): UseInvestmentGoalLinkReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isLinking, setIsLinking] = useState<boolean>(false)

  const linkRecordToGoal = useCallback(
    async (recordId: string, goalId: string | null): Promise<void> => {
      if (!userId) return
      setIsLinking(true)
      try {
        const { error } = await supabase
          .from('records')
          .update({ goal_id: goalId })
          .eq('id', recordId)
          .eq('user_id', userId)
        if (error) throw error
      } catch (e) {
        console.error('linkRecordToGoal failed:', e)
        throw e
      } finally {
        setIsLinking(false)
      }
    },
    [userId, supabase],
  )

  return { linkRecordToGoal, isLinking }
}
