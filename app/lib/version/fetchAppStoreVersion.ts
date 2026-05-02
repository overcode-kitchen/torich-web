import { APP_BUNDLE_ID, ITUNES_LOOKUP_TIMEOUT_MS } from './constants'

export interface AppStoreLookupResult {
  version: string
  trackId: number
  trackViewUrl: string
}

/**
 * iTunes Lookup API로 App Store 최신 버전 조회.
 * 실패/타임아웃 시 null 반환 (앱 동작에 영향 없음).
 */
export async function fetchAppStoreVersion(
  bundleId: string = APP_BUNDLE_ID,
): Promise<AppStoreLookupResult | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ITUNES_LOOKUP_TIMEOUT_MS)

  try {
    const url = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}&country=kr`
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as {
      resultCount?: number
      results?: Array<{ version?: string; trackId?: number; trackViewUrl?: string }>
    }
    const first = data.results?.[0]
    if (!first?.version || !first.trackId || !first.trackViewUrl) return null
    return {
      version: first.version,
      trackId: first.trackId,
      trackViewUrl: first.trackViewUrl,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
