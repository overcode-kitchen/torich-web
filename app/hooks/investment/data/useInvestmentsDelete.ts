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
        // 해당 record의 미발송 알림 취소 (scheduled_notifications에서 pending 삭제)
        const { error: cancelError } = await supabase
          .from('scheduled_notifications')
          .delete()
          .eq('record_id', id)
          .eq('status', 'pending')

        if (cancelError) {
          console.warn('Failed to cancel scheduled notifications for record:', id, cancelError)
          // 알림 취소 실패해도 record 삭제는 진행
        }

        // 이 record에 딸린 납입 기록(payment_history)을 먼저 지운다.
        // payment_history_record_id_fkey 에 ON DELETE CASCADE가 없으면
        // 납입 기록이 있는(=완료된) 항목의 records 삭제가 FK 위반으로 실패한다.
        // → records 삭제 전에 정리해, 완료된 적립 항목도 정상 삭제되게 한다.
        // (postponed_payments는 FK가 ON DELETE CASCADE라 자동 정리된다.)
        const { error: paymentError } = await supabase
          .from('payment_history')
          .delete()
          .eq('record_id', id)
          .eq('user_id', userId)
        if (paymentError) throw paymentError

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
