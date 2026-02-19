'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Investment } from '@/app/types/investment'
import type { RecordDeleteResult } from '../../types/useInvestments'

export interface UseInvestmentsDeleteReturn {
  deleteInvestment: (id: string) => Promise<void>
  isDeleting: boolean
  setIsDeleting: (deleting: boolean) => void
}

export function useInvestmentsDelete(
  userId: string | undefined,
  records: Investment[],
  setRecords: (records: Investment[] | ((prev: Investment[]) => Investment[])) => void
): UseInvestmentsDeleteReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const deleteInvestment = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) return

      setIsDeleting(true)
      const prevRecords: Investment[] = records

      setRecords((current: Investment[]): Investment[] =>
        current.filter((r: Investment): boolean => r.id !== id),
      )

      try {
        const result: RecordDeleteResult = await supabase.from('records').delete().eq('id', id)
        if (result.error) throw result.error
      } catch (error) {
        setRecords(prevRecords)
        throw error
      } finally {
        setIsDeleting(false)
      }
    },
    [records, supabase, userId, setRecords],
  )

  return {
    deleteInvestment,
    isDeleting,
    setIsDeleting,
  }
}
