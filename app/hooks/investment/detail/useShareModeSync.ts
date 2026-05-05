'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../../auth/useAuth'
import { fetchPriceWithFallback } from '@/app/utils/stock-price-fetcher'
import { syncSharesMonthlyAmount } from '@/app/utils/sync-shares-monthly-amount'
import type { Investment } from '@/app/types/investment'

/**
 * 종목 상세 진입 시 시세 캐시 갱신 + shares 모드면 monthly_amount 동기화.
 * stale 환산값으로 알림/카드/통계가 부정확해지는 것을 자동으로 막는 보강.
 */
export function useShareModeSync(item: Investment): void {
  const { user } = useAuth()

  useEffect(() => {
    if (!item.symbol) return
    void fetchPriceWithFallback(item.symbol).then((price) => {
      if (
        !price ||
        price <= 0 ||
        item.unit_type !== 'shares' ||
        !item.monthly_shares ||
        !user?.id
      ) {
        return
      }
      const supabase = createClient()
      void syncSharesMonthlyAmount(supabase, user.id, item.id, item.monthly_shares, price)
    })
  }, [item.symbol, item.unit_type, item.monthly_shares, item.id, user?.id])
}
