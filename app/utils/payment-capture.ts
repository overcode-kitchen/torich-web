import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchPriceWithFallback } from './stock-price-fetcher'

export interface CapturedPayment {
  capturedShares: number | null
  capturedPrice: number | null
  /** 1·2단계 fallback 모두 실패해 captured_price를 못 채운 경우 true */
  priceFailed: boolean
}

const EMPTY_CAPTURE: CapturedPayment = {
  capturedShares: null,
  capturedPrice: null,
  priceFailed: false,
}

/**
 * 매수 ✓ 시점에 records를 조회해 captured_shares / captured_price를 산출한다.
 * 모드별 분기:
 *   - shares 모드: captured_shares = monthly_shares (정수)
 *   - amount 모드: captured_shares = monthly_amount / captured_price
 * captured_price 산출은 stock-price-fetcher의 fallback 체인을 따른다.
 *
 * 참고 spec: .omc/specs/deep-interview-n-shares-investment.md (4-2, 5)
 */
export async function capturePriceForPayment(
  supabase: SupabaseClient,
  userId: string,
  recordId: string
): Promise<CapturedPayment> {
  try {
    const { data: record, error } = await supabase
      .from('records')
      .select('symbol, monthly_amount, unit_type, monthly_shares')
      .eq('id', recordId)
      .eq('user_id', userId)
      .single()

    if (error || !record || !record.symbol) {
      return EMPTY_CAPTURE
    }

    const capturedPrice = await fetchPriceWithFallback(record.symbol)

    let capturedShares: number | null = null
    if (record.unit_type === 'shares') {
      capturedShares = record.monthly_shares ?? null
    } else if (capturedPrice && capturedPrice > 0 && record.monthly_amount > 0) {
      capturedShares = record.monthly_amount / capturedPrice
    }

    return {
      capturedShares,
      capturedPrice,
      priceFailed: capturedPrice === null,
    }
  } catch {
    return { ...EMPTY_CAPTURE, priceFailed: true }
  }
}
