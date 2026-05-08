'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Goal, GoalCreateInput } from '@/app/types/goal'

export interface UseGoalCreateReturn {
  createGoal: (input: GoalCreateInput) => Promise<Goal | null>
  isCreating: boolean
}

export function useGoalCreate(userId: string | undefined): UseGoalCreateReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isCreating, setIsCreating] = useState<boolean>(false)

  const createGoal = useCallback(
    async (input: GoalCreateInput): Promise<Goal | null> => {
      if (!userId) return null
      setIsCreating(true)
      try {
        const { data, error } = await supabase
          .from('goals')
          .insert({ user_id: userId, ...input })
          .select('*')
          .single()
        if (error) throw error
        return data as Goal
      } catch (e) {
        console.error('useGoalCreate failed:', e)
        throw e
      } finally {
        setIsCreating(false)
      }
    },
    [userId, supabase],
  )

  return { createGoal, isCreating }
}
