'use client'

import { useEffect, useState } from 'react'
import { isCapacitorNative } from '@/lib/auth/capacitor-native'

const WEB_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? ''

/**
 * 현재 앱 버전을 반환.
 * - 네이티브(Capacitor): 설치된 빌드의 MARKETING_VERSION (App.getInfo)
 * - 웹: package.json 버전 (next.config의 NEXT_PUBLIC_APP_VERSION)
 */
export function useAppVersion(): string {
  const [version, setVersion] = useState(WEB_VERSION)

  useEffect(() => {
    if (!isCapacitorNative()) return
    let cancelled = false
    import('@capacitor/app')
      .then(({ App }) => App.getInfo())
      .then(info => {
        if (!cancelled) setVersion(info.version)
      })
      .catch(() => {
        // 실패 시 web fallback 유지
      })
    return () => {
      cancelled = true
    }
  }, [])

  return version
}
