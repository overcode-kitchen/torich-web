'use client'

import { useEffect, useState } from 'react'
import { useIsNativeApp } from './useIsNativeApp'

const APP_STORE_ID = '6761295498'
const LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APP_STORE_ID}&country=kr`

export interface AppUpdateInfo {
  hasUpdate: boolean
  currentVersion: string | null
  latestVersion: string | null
}

const INITIAL_INFO: AppUpdateInfo = {
  hasUpdate: false,
  currentVersion: null,
  latestVersion: null,
}

/**
 * 시맨틱 버전 비교: a < b → 음수, a > b → 양수, a == b → 0
 * 누락 자리는 0으로 보정.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0)
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i += 1) {
    const ai = pa[i] ?? 0
    const bi = pb[i] ?? 0
    if (ai !== bi) return ai - bi
  }
  return 0
}

/**
 * iTunes Lookup API로 최신 스토어 버전을 가져와 설치된 버전과 비교한다.
 * - 네이티브 앱이 아닐 때(웹 등): 항상 hasUpdate = false
 * - 네트워크/조회 실패: 안전하게 hasUpdate = false 유지
 *
 * 주의: iTunes Lookup은 신버전 출시 후 수 시간 캐싱되어 즉시 반영되지 않을 수 있다.
 */
export function useAppUpdateCheck(): AppUpdateInfo {
  const isNativeApp = useIsNativeApp()
  const [info, setInfo] = useState<AppUpdateInfo>(INITIAL_INFO)

  useEffect(() => {
    if (!isNativeApp) return

    let cancelled = false

    const run = async (): Promise<void> => {
      try {
        const { App } = await import('@capacitor/app')
        const appInfo = await App.getInfo()
        const currentVersion = appInfo.version
        if (!currentVersion) return

        const res = await fetch(LOOKUP_URL, { cache: 'no-store' })
        if (!res.ok) return

        const data: { results?: { version?: string }[] } = await res.json()
        const latestVersion = data.results?.[0]?.version
        if (!latestVersion) return

        if (cancelled) return
        setInfo({
          hasUpdate: compareVersions(currentVersion, latestVersion) < 0,
          currentVersion,
          latestVersion,
        })
      } catch {
        // 조회 실패는 사용자에게 노출하지 않음 (업데이트 버튼 숨김 유지)
      }
    }

    void run()

    return (): void => {
      cancelled = true
    }
  }, [isNativeApp])

  return info
}
