'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Investment } from '@/app/types/investment'
import type { RecordUpdateResult } from './types/useInvestments'

export interface UseInvestmentsUpdateReturn {
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>
  isUpdating: boolean
  setIsUpdating: (updating: boolean) => void
}

export function useInvestmentsUpdate(
  userId: string | undefined,
  records: Investment[],
  setRecords: (records: Investment[] | ((prev: Investment[]) => Investment[])) => void
): UseInvestmentsUpdateReturn {
  const supabase = useMemo(() => createClient(), [])
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  const updateInvestment = useCallback(
    async (id: string, data: Partial<Investment>): Promise<void> => {
      if (!userId) return

      setIsUpdating(true)
      const prevRecords: Investment[] = records

      setRecords((current: Investment[]): Investment[] =>
        current.map((r: Investment): Investment => (r.id === id ? { ...r, ...data } : r)),
      )

      // Filter data to only include known columns
      const validColumns = [
        'title', 'symbol', 'monthly_amount', 'period_years',
        'annual_rate', 'expected_amount', 'start_date',
        'investment_days', 'is_custom_rate', 'notification_enabled'
      ]

      const updateData: any = {}
      Object.keys(data).forEach(key => {
        if (validColumns.includes(key)) {
          // @ts-ignore
          updateData[key] = data[key]
        }
      })

      console.log('Update attempt:', { id, userId, updateData })

      try {
        // debug: check if record exists for this user
        const { data: checkData, error: checkError } = await supabase
          .from('records')
          .select('id, user_id')
          .eq('id', id)
          .maybeSingle()

        console.log('Pre-update check:', { checkData, checkError })

        if (!checkData) {
          console.error('Record not found via select. ID:', id, 'User:', userId)
        }

        // 1. Update without returning data (avoids 406)
        const updateResult = await supabase
          .from('records')
          .update(updateData)
          .eq('id', id)

        if (updateResult.error) throw updateResult.error

        console.log('Update success, fetching new data...')

        // 2. Fetch updated data
        const { data: newData, error: fetchError } = await supabase
          .from('records')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        if (newData) {
          setRecords((current: Investment[]): Investment[] =>
            current.map((r: Investment): Investment => (r.id === id ? newData : r)),
          )
        }
      } catch (error) {
        console.error('Update failed:', error)
        setRecords(prevRecords)
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [records, supabase, userId, setRecords],
  )

  return {
    updateInvestment,
    isUpdating,
    setIsUpdating,
  }
}
