'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import type { Investment } from '@/app/types/investment'

type UseInvestmentsReturn = {
  records: Investment[]
  isLoading: boolean
  isDeleting: boolean
  isUpdating: boolean
  setRecords: Dispatch<SetStateAction<Investment[]>>
  refetch: () => Promise<void>
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
}

type RecordsSelectResult = {
  data: Investment[] | null
  error: PostgrestError | null
}

type RecordUpdateResult = {
  data: Investment | null
  error: PostgrestError | null
}

type RecordDeleteResult = {
  error: PostgrestError | null
}

export const useInvestments = (userId?: string): UseInvestmentsReturn => {
  const supabase = useMemo(() => createClient(), [])

  const [records, setRecords] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

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
  }, [supabase, userId])

  useEffect((): void => {
    void refetch()
  }, [refetch])

  const updateInvestment = useCallback(
    async (id: string, data: Partial<Investment>): Promise<void> => {
      if (!userId) return

      setIsUpdating(true)
      const prevRecords: Investment[] = records

      setRecords((current: Investment[]): Investment[] =>
        current.map((r: Investment): Investment => (r.id === id ? { ...r, ...data } : r)),
      )

      try {
        const result: RecordUpdateResult = await supabase
          .from('records')
          .update(data)
          .eq('id', id)
          .select('*')
          .single()

        if (result.error) throw result.error

        if (result.data) {
          setRecords((current: Investment[]): Investment[] =>
            current.map((r: Investment): Investment => (r.id === id ? result.data! : r)),
          )
        }
      } catch (error) {
        setRecords(prevRecords)
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [records, supabase, userId],
  )

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
    [records, supabase, userId],
  )

  return {
    records,
    isLoading,
    isDeleting,
    isUpdating,
    setRecords,
    refetch,
    updateInvestment,
    deleteInvestment,
  }
}
