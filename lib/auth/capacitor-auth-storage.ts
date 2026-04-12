/**
 * 네이티브 앱에서 Supabase Auth(PKCE code verifier 등)를 Capacitor Preferences에 저장.
 * WebView 재로드/앱 복귀 후에도 유지되어 exchangeCodeForSession이 동작하도록 함.
 *
 * 동일 키에 대한 반복 getItem → Preferences.get 브리지 호출을 줄이기 위해 메모리 캐시 및
 * 진행 중인 읽기 요청을 공유합니다.
 */
const PREFIX = 'torich_sb_auth_'

const memoryCache = new Map<string, string | null>()
const inFlightReads = new Map<string, Promise<string | null>>()

async function getItem(key: string): Promise<string | null> {
  const storageKey = PREFIX + key

  if (memoryCache.has(storageKey)) {
    return memoryCache.get(storageKey) ?? null
  }

  const pending = inFlightReads.get(storageKey)
  if (pending) {
    return pending
  }

  const readPromise = (async (): Promise<string | null> => {
    try {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key: storageKey })
      const resolved = value ?? null
      memoryCache.set(storageKey, resolved)
      return resolved
    } catch {
      return null
    } finally {
      inFlightReads.delete(storageKey)
    }
  })()

  inFlightReads.set(storageKey, readPromise)
  return readPromise
}

async function setItem(key: string, value: string): Promise<void> {
  const storageKey = PREFIX + key
  memoryCache.set(storageKey, value)
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key: storageKey, value })
  } catch {
    // ignore
  }
}

async function removeItem(key: string): Promise<void> {
  const storageKey = PREFIX + key
  memoryCache.delete(storageKey)
  inFlightReads.delete(storageKey)
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key: storageKey })
  } catch {
    // ignore
  }
}

export const capacitorAuthStorage = {
  getItem,
  setItem,
  removeItem,
}
