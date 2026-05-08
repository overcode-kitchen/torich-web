/**
 * 시세 캐시 유틸 (localStorage 기반)
 * 매수 ✓ 시점에 실시간 시세 호출이 실패해도 fallback으로 쓰이는 캐시.
 * 종목 페이지 진입·등록 시 자동으로 갱신된다.
 */

const CACHE_KEY_PREFIX = 'torich:stock-price:'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7일

interface CachedPrice {
  price: number
  savedAt: number // Unix ms
}

function buildKey(symbol: string): string {
  return `${CACHE_KEY_PREFIX}${symbol.toUpperCase()}`
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * 캐시된 시세를 반환. 없거나 TTL(7일) 초과면 null.
 */
export function getCachedPrice(symbol: string): number | null {
  if (!isBrowser() || !symbol) return null
  try {
    const raw = window.localStorage.getItem(buildKey(symbol))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CachedPrice>
    if (typeof parsed.price !== 'number' || typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null
    return parsed.price
  } catch {
    return null
  }
}

/**
 * 시세를 캐시에 저장. price > 0 만 받아들임.
 */
export function setCachedPrice(symbol: string, price: number): void {
  if (!isBrowser() || !symbol) return
  if (!Number.isFinite(price) || price <= 0) return
  try {
    const payload: CachedPrice = { price, savedAt: Date.now() }
    window.localStorage.setItem(buildKey(symbol), JSON.stringify(payload))
  } catch {
    // localStorage가 가득 찼거나 접근 불가 — best-effort라 무시
  }
}

/**
 * (선택) 캐시 삭제. 종목 삭제 등 정리 흐름에서 사용 가능.
 */
export function clearCachedPrice(symbol: string): void {
  if (!isBrowser() || !symbol) return
  try {
    window.localStorage.removeItem(buildKey(symbol))
  } catch {
    // 무시
  }
}
