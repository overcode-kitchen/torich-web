'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import type { Investment } from '@/app/types/investment'

export interface UseInvestmentsFetchReturn {
  refetch: () => Promise<void>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export function useInvestmentsFetch(
  userId: string | undefined,
  setRecords: (records: Investment[]) => void
): UseInvestmentsFetchReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const refetch = useCallback(async (): Promise<void> => {
    if (!userId) {
      setRecords([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      // 수동 드래그 순서(sort_order)는 클라이언트 stable sort로 적용한다. 쿼리에
      // .order('sort_order')를 걸면 컬럼 마이그레이션 전 DB에선 조회가 통째로 실패하므로
      // (신앱+구DB 호환) 여기서 정렬한다. 목적 카드에서 goal_id로 필터해도 상대 순서가 유지된다.
      const rows = (data ?? []) as Investment[]
      const ordered = [...rows].sort(
        (a, b) =>
          (a.sort_order ?? Number.POSITIVE_INFINITY) -
          (b.sort_order ?? Number.POSITIVE_INFINITY),
      )
      setRecords(ordered)
    } catch (err) {
      toastError(TOAST_MESSAGES.investmentListLoadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId, setRecords])

  return {
    refetch,
    isLoading,
    setIsLoading,
  }
}
