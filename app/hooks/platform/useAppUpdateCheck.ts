'use client'

import { useCallback, useEffect, useState } from 'react'
import { isCapacitorNative } from '@/lib/auth/capacitor-native'
import { useAppVersion } from './useAppVersion'
import { compareVersions } from '@/app/lib/version/compareVersions'
import { fetchAppStoreVersion } from '@/app/lib/version/fetchAppStoreVersion'
import {
  UPDATE_PROMPT_COOLDOWN_MS,
  UPDATE_PROMPT_STORAGE_KEY,
} from '@/app/lib/version/constants'

interface DismissRecord {
  version: string
  dismissedAt: number
}

export interface AppUpdateCheckState {
  isOpen: boolean
  currentVersion: string | null
  latestVersion: string | null
  onUpdate: () => Promise<void>
  onDismiss: () => Promise<void>
}

const APP_STORE_ID = process.env.NEXT_PUBLIC_APP_STORE_ID ?? ''

/**
 * iOS 네이티브 앱 진입 시 App Store 최신 버전과 비교하여
 * 업데이트 권고 팝업의 노출 여부를 결정.
 * - 웹/안드로이드/SSR: 항상 미노출
 * - 환경변수 미설정/네트워크 실패: 조용히 미노출 (앱 동작 무영향)
 */
export function useAppUpdateCheck(): AppUpdateCheckState {
  const currentVersion = useAppVersion()
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isCapacitorNative()) return
    if (!APP_STORE_ID) {
      console.warn('[AppUpdateCheck] NEXT_PUBLIC_APP_STORE_ID 미설정 → 업데이트 팝업 스킵')
      return
    }
    if (!currentVersion) return

    let cancelled = false

    ;(async () => {
      try {
        const result = await fetchAppStoreVersion()
        if (cancelled || !result) return
        if (compareVersions(result.version, currentVersion) <= 0) return

        const dismiss = await readDismissRecord()
        if (cancelled) return
        if (dismiss && shouldSuppress(dismiss, result.version)) return

        setLatestVersion(result.version)
        setIsOpen(true)
      } catch (err) {
        console.warn('[AppUpdateCheck] error', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentVersion])

  const onUpdate = useCallback(async () => {
    setIsOpen(false)
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: `https://apps.apple.com/app/id${APP_STORE_ID}` })
    } catch (err) {
      console.warn('[AppUpdateCheck] App Store 열기 실패', err)
    }
  }, [])

  const onDismiss = useCallback(async () => {
    setIsOpen(false)
    if (!latestVersion) return
    try {
      const { Preferences } = await import('@capacitor/preferences')
      const record: DismissRecord = { version: latestVersion, dismissedAt: Date.now() }
      await Preferences.set({ key: UPDATE_PROMPT_STORAGE_KEY, value: JSON.stringify(record) })
    } catch {
      // silent
    }
  }, [latestVersion])

  return {
    isOpen,
    currentVersion: currentVersion || null,
    latestVersion,
    onUpdate,
    onDismiss,
  }
}

async function readDismissRecord(): Promise<DismissRecord | null> {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: UPDATE_PROMPT_STORAGE_KEY })
    if (!value) return null
    const parsed = JSON.parse(value) as Partial<DismissRecord>
    if (typeof parsed.version !== 'string' || typeof parsed.dismissedAt !== 'number') return null
    return { version: parsed.version, dismissedAt: parsed.dismissedAt }
  } catch {
    return null
  }
}

function shouldSuppress(dismiss: DismissRecord, latestVersion: string): boolean {
  // 새 버전이 등장했다면 쿨다운 무시하고 다시 노출
  if (dismiss.version !== latestVersion) return false
  return Date.now() - dismiss.dismissedAt < UPDATE_PROMPT_COOLDOWN_MS
}
