/**
 * 네이티브 앱에서 Supabase Auth(PKCE code verifier 등)를 Capacitor Preferences에 저장.
 * WebView 재로드/앱 복귀 후에도 유지되어 exchangeCodeForSession이 동작하도록 함.
 */
const PREFIX = 'torich_sb_auth_'

async function getItem(key: string): Promise<string | null> {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: PREFIX + key })
    return value
  } catch {
    return null
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key: PREFIX + key, value })
  } catch {
    // ignore
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key: PREFIX + key })
  } catch {
    // ignore
  }
}

export const capacitorAuthStorage = {
  getItem,
  setItem,
  removeItem,
}
