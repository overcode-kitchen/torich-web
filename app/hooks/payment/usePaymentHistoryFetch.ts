'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import type { CapturedAmountsMap, PaymentHistoryMap } from '@/app/types/payment'

export interface UsePaymentHistoryFetchReturn {
  refetch: () => Promise<void>
  isLoading: boolean
}

/**
 * payment_history 조회. 상태 보관은 PaymentHistoryProvider가 하고, 여기서는 조회만 한다.
 *
 * setter를 파라미터로 받는 구조인 이유: 이렇게 해야 프로바이더의 effect가 setState를
 * 직접 호출하지 않게 되어 react-hooks/set-state-in-effect 를 피한다.
 * (useGoalsFetch가 같은 이유로 useGoals에서 분리돼 있다)
 *
 * userId(문자열)를 받고 user 객체를 받지 않는 것도 의도다. Supabase가 토큰을 갱신할 때마다
 * onAuthStateChange가 새 user 객체를 넣어주는데, 그걸 의존성으로 두면 50분마다 전체 이력을
 * 다시 받는다.
 */
export function usePaymentHistoryFetch(
  userId: string | undefined,
  setCompleted: (map: PaymentHistoryMap) => void,
  setRetroactive: (map: PaymentHistoryMap) => void,
  setCaptured: (map: CapturedAmountsMap) => void,
): UsePaymentHistoryFetchReturn {
  const supabase = useMemo(() => createClient(), [])
  // 최초 1회 조회에만 true. refetch는 이 값을 되돌리지 않는다 —
  // GoalGroupSection이 isLoading일 때 홈 목적 섹션을 통째로 숨기므로(`if (isLoading) return null`),
  // 백그라운드 갱신마다 목적 카드가 사라졌다 나타나게 된다.
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refetch = useCallback(async (): Promise<void> => {
    if (!userId) {
      setCompleted(new Map())
      setRetroactive(new Map())
      setCaptured(new Map())
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('record_id, payment_date, is_retroactive, captured_shares, captured_price')
        .eq('user_id', userId)

      if (error) throw error

      const autoMap: PaymentHistoryMap = new Map()
      const retroMap: PaymentHistoryMap = new Map()
      const capturedMap: CapturedAmountsMap = new Map()

      data?.forEach((item) => {
        const target = item.is_retroactive ? retroMap : autoMap
        if (!target.has(item.record_id)) {
          target.set(item.record_id, new Set())
        }
        target.get(item.record_id)?.add(item.payment_date)

        // 매수 시점 실제 납입액 = 캡처 주수 × 캡처 시세 (둘 다 있을 때만)
        const shares = item.captured_shares
        const price = item.captured_price
        if (shares != null && price != null && shares > 0 && price > 0) {
          if (!capturedMap.has(item.record_id)) {
            capturedMap.set(item.record_id, new Map())
          }
          capturedMap.get(item.record_id)?.set(item.payment_date, Math.round(shares * price))
        }
      })

      setCompleted(autoMap)
      setRetroactive(retroMap)
      setCaptured(capturedMap)
    } catch {
      toastError(TOAST_MESSAGES.paymentHistoryLoadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId, setCompleted, setRetroactive, setCaptured])

  return { refetch, isLoading }
}
