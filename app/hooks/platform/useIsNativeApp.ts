'use client'

import { useEffect, useState } from 'react'
import { isCapacitorNative } from '@/lib/auth/capacitor-native'

/**
 * Capacitor 네이티브 앱(WebView) 환경 여부를 감지하는 훅
 * - SSR/일반 웹 브라우저에서는 false
 * - iOS/Android Capacitor WebView에서는 true
 */
export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(isCapacitorNative())
  }, [])

  return isNative
}

