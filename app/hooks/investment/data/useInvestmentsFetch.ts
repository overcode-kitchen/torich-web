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
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      setRecords((data ?? []) as Investment[])
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
