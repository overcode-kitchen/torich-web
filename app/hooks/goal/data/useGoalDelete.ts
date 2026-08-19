'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import type { Investment } from '@/app/types/investment'

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
  const { setRecords } = useInvestmentsContext()
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

        // FK가 DB에서 끊어준 연결을 로컬 상태에도 반영한다. 이걸 빠뜨리면 홈의
        // records는 사라진 목적의 id를 계속 들고 있어, 어느 목적 그룹에도
        // "목적 미지정"에도 속하지 못하고 화면에서 통째로 사라진다 (#162와 동일 원인).
        setRecords((current: Investment[]): Investment[] =>
          current.map((r: Investment): Investment =>
            r.goal_id === id ? { ...r, goal_id: null } : r,
          ),
        )
      } catch (e) {
        console.error('useGoalDelete failed:', e)
        throw e
      } finally {
        setIsDeleting(false)
      }
    },
    [userId, supabase, setRecords],
  )

  return { deleteGoal, isDeleting }
}
