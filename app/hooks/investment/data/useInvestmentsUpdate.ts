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
  'settled_at',
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

      // 화이트리스트에 없는 키는 조용히 빠진다. 넘긴 값이 **전부** 빠졌다면
      // 그건 저장할 게 없는 호출이 아니라 컬럼 등록을 빠뜨린 버그다.
      // 예전에는 이 경우 빈 UPDATE가 성공으로 끝나고, 직후 재조회가 낙관적
      // 업데이트를 되돌려 호출부만 성공한 줄 알았다 (settled_at 누락, #160).
      const requestedKeys = (Object.keys(data) as (keyof Investment)[]).filter(
        (key) => data[key] !== undefined,
      )
      if (requestedKeys.length > 0 && Object.keys(updateData).length === 0) {
        setRecords(prevRecords)
        setIsUpdating(false)
        throw new Error(
          `updateInvestment: 저장 가능한 컬럼이 없습니다. UPDATABLE_COLUMNS에 누락된 키: ${requestedKeys.join(', ')}`,
        )
      }

      try {
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
