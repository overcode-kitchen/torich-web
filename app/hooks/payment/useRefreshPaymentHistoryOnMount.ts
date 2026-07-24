'use client'

import { useEffect } from 'react'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'

/**
 * 상세 화면 진입 시 납입 기록을 한 번 다시 받는다.
 *
 * 납입 기록이 전역 상태가 되면서 "화면이 마운트될 때마다 새로 받는" 성질이 사라졌다.
 * 앱 안에서 일어난 변경은 전역 상태가 이미 알고 있지만 다른 기기에서 바꾼 것은 모르므로,
 * 기록을 자세히 들여다보는 상세 화면에서만 명시적으로 갱신한다.
 *
 * refetch는 isLoading을 다시 true로 만들지 않으므로 화면이 깜빡이지 않는다.
 */
export function useRefreshPaymentHistoryOnMount(): void {
  const { refetch } = usePaymentHistoryContext()

  useEffect(() => {
    void refetch()
  }, [refetch])
}
