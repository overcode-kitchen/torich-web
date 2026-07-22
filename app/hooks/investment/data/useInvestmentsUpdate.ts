'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Investment } from '@/app/types/investment'
import type { RecordUpdateResult } from '../../types/useInvestments'

/**
 * DB `records` 테이블에 실제로 존재하는, 수정 가능한 컬럼 목록.
 *
 * `satisfies` 덕분에 스키마가 바뀌어 Investment에서 컬럼이 사라지면
 * 런타임이 아니라 **컴파일 단계에서** 걸린다. 예전에는 이 배열이 그냥
 * string[] 이라 오타나 삭제된 컬럼을 아무도 잡지 못했다.
 */
const UPDATABLE_COLUMNS = [
  'title', 'symbol', 'monthly_amount', 'period_years',
  'annual_rate', 'start_date',
  'investment_days', 'is_custom_rate', 'notification_enabled',
  'goal_id',
  'record_type', 'interest_rate', 'maturity_date',
  'unit_type', 'monthly_shares',
] as const satisfies readonly (keyof Investment)[]

/** 키별로 좁혀진 타입을 유지한 채 복사한다. 제네릭이라 캐스팅이 필요 없다. */
function copyIfPresent<K extends keyof Investment>(
  target: Partial<Investment>,
  source: Partial<Investment>,
  key: K,
): void {
  if (source[key] !== undefined) target[key] = source[key]
}

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

      const updateData: Partial<Investment> = {}
      for (const key of UPDATABLE_COLUMNS) {
        copyIfPresent(updateData, data, key)
      }

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

        // notification_enabled가 false로 바뀐 경우 해당 record의 미발송 알림 취소
        if (updateData.notification_enabled === false) {
          const { error: cancelError } = await supabase
            .from('scheduled_notifications')
            .delete()
            .eq('record_id', id)
            .eq('status', 'pending')
          if (cancelError) {
            console.warn('Failed to cancel scheduled notifications for record:', id, cancelError)
          }
        }
        // notification_enabled가 true로 바뀐 경우 재예약은 records UPDATE 시 Database Webhook(schedule-notification)으로 처리됨

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
            current.map((r: Investment): Investment => (r.id === id ? (newData as Investment) : r)),
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
