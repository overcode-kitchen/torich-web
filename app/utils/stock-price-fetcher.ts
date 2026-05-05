import { apiClient } from '@/lib/api-client'
import { getCachedPrice, setCachedPrice } from './stock-price-cache'

interface StockApiResponse {
  symbol?: string
  name?: string
  averageRate?: number
  currentPrice?: unknown
}

/**
 * 시세 조회 fallback 체인.
 * 1) 실시간 시세 호출 (/api/stock) — 성공 시 캐시에 갱신
 * 2) 로컬 캐시 (TTL 7일)
 * 3) 실패 → null (✓ 자체는 막지 않음. captured_price = NULL로 저장)
 *
 * 참고 spec: .omc/specs/deep-interview-n-shares-investment.md (5번)
 */
export async function fetchPriceWithFallback(symbol: string): Promise<number | null> {
  if (!symbol) return null

  // 1단계: 실시간
  try {
    const data = (await apiClient(`/api/stock?symbol=${encodeURIComponent(symbol)}`)) as StockApiResponse
    const price = data?.currentPrice
    if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
      setCachedPrice(symbol, price)
      return price
    }
  } catch {
    // 1단계 실패 → 다음 단계
  }

  // 2단계: 캐시
  const cached = getCachedPrice(symbol)
  if (cached !== null) return cached

  // 3단계: 포기 (NULL)
  return null
}
