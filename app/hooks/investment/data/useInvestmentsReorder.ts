'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Investment } from '@/app/types/investment'

export interface UseInvestmentsReorderReturn {
  reorderInvestments: (orderedIds: string[]) => Promise<void>
  isReordering: boolean
}

/**
 * 목적 카드 안의 적립 항목 순서를 저장한다.
 * - orderedIds 순서대로 sort_order = 0,1,2... 를 병렬 UPDATE.
 * - 낙관적 반영: 먼저 전역 records에서 orderedIds에 속한 항목만 새 순서로 재배치한다
 *   (나머지 항목의 위치는 유지). 실패하면 이전 상태로 롤백.
 * - updateInvestment(단건 + 사전 select + 재조회)보다 가볍게, 여러 행을 병렬 UPDATE 한다.
 */
export function useInvestmentsReorder(
  userId: string | undefined,
  records: Investment[],
  setRecords: (records: Investment[] | ((prev: Investment[]) => Investment[])) => void,
): UseInvestmentsReorderReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isReordering, setIsReordering] = useState<boolean>(false)

  const reorderInvestments = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      if (!userId || orderedIds.length === 0) return
      const prevRecords: Investment[] = records
      const orderIndex = new Map(orderedIds.map((id, i) => [id, i]))
      const rank = (id: string): number => orderIndex.get(id) ?? 0

      // 낙관적: orderedIds에 해당하는 항목을 새 순서(+sort_order)로, 나머지는 원위치 유지.
      setRecords((current: Investment[]): Investment[] => {
        const targets = current
          .filter((r) => orderIndex.has(r.id))
          .slice()
          .sort((a, b) => rank(a.id) - rank(b.id))
          .map((r) => ({ ...r, sort_order: rank(r.id) }))
        let ti = 0
        return current.map((r) => (orderIndex.has(r.id) ? targets[ti++] : r))
      })

      setIsReordering(true)
      try {
        const results = await Promise.all(
          orderedIds.map((id, index) =>
            supabase
              .from('records')
              .update({ sort_order: index })
              .eq('id', id)
              .eq('user_id', userId),
          ),
        )
        const failed = results.find((r) => r.error)
        if (failed?.error) throw failed.error
      } catch (e) {
        console.error('useInvestmentsReorder failed:', e)
        setRecords(prevRecords)
        throw e
      } finally {
        setIsReordering(false)
      }
    },
    [userId, supabase, records, setRecords],
  )

  return { reorderInvestments, isReordering }
}
