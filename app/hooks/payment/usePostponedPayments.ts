'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../auth/useAuth'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'

export type PostponedPaymentsMap = Map<string, Set<string>> // recordId -> Set<YYYY-MM-DD>

/**
 * 납입 "미루기" 상태 관리.
 *
 * payment_history가 "행 존재 = 완료"이듯, postponed_payments는 "행 존재 = 미룸".
 * 홈 체크리스트·캘린더가 동일한 미룸 상태를 공유하도록 DB 기반으로 둔다.
 */
export function usePostponedPayments() {
  const { user } = useAuth()
  const supabase = createClient()
  const [postponedPayments, setPostponedPayments] = useState<PostponedPaymentsMap>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const fetchPostponed = useCallback(async () => {
    if (!user) {
      setPostponedPayments(new Map())
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('postponed_payments')
        .select('record_id, payment_date')
        .eq('user_id', user.id)

      if (error) throw error

      const map = new Map<string, Set<string>>()
      data?.forEach((item) => {
        if (!map.has(item.record_id)) map.set(item.record_id, new Set())
        map.get(item.record_id)?.add(item.payment_date)
      })
      setPostponedPayments(map)
    } catch {
      toastError(TOAST_MESSAGES.loadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchPostponed()
  }, [fetchPostponed])

  const applyOptimistic = (recordId: string, date: string, currentPostponed: boolean) => {
    setPostponedPayments((prev) => {
      const next = new Map(prev)
      if (!next.has(recordId)) next.set(recordId, new Set())
      const dates = next.get(recordId)!
      if (currentPostponed) dates.delete(date)
      else dates.add(date)
      return next
    })
  }

  /**
   * 미룸 토글.
   * @param recordId 투자 ID
   * @param date "YYYY-MM-DD"
   * @param currentPostponed 현재 미룸 상태 (true면 해제, false면 미룸 처리)
   */
  const togglePostpone = useCallback(
    async (recordId: string, date: string, currentPostponed: boolean) => {
      if (!user) return
      applyOptimistic(recordId, date, currentPostponed)

      try {
        if (currentPostponed) {
          const { error } = await supabase
            .from('postponed_payments')
            .delete()
            .eq('user_id', user.id)
            .eq('record_id', recordId)
            .eq('payment_date', date)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('postponed_payments')
            .upsert(
              { user_id: user.id, record_id: recordId, payment_date: date },
              { onConflict: 'user_id,record_id,payment_date' },
            )
          if (error) throw error
        }
      } catch {
        toastError(TOAST_MESSAGES.saveFailed)
        fetchPostponed()
      }
    },
    [user, supabase, fetchPostponed],
  )

  return {
    postponedPayments,
    togglePostpone,
    isLoading,
  }
}
