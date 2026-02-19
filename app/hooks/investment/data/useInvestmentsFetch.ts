'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RecordsSelectResult } from '../../types/useInvestments'

export interface UseInvestmentsFetchReturn {
  refetch: () => Promise<void>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export function useInvestmentsFetch(
  userId: string | undefined,
  setRecords: (records: any[]) => void
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
      const result: RecordsSelectResult = await supabase
        .from('records')
        .select('*')
        .eq('user_id', userId)

      if (result.error) throw result.error

      setRecords(result.data ?? [])
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
