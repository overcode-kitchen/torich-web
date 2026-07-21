'use client'

import { useState } from 'react'
import { isCapacitorNative } from '@/lib/auth/capacitor-native'

/**
 * Capacitor 네이티브 앱(WebView) 환경 여부를 감지하는 훅
 * - SSR/일반 웹 브라우저에서는 false
 * - iOS/Android Capacitor WebView에서는 true
 */
export function useIsNativeApp(): boolean {
  // 빌드 프리렌더(window 없음)에서는 false로 시작하고, 브라우저/네이티브 첫 렌더에서는
  // 곧바로 실제 환경값을 계산한다. useState(false)로 시작하면 뒤로가기로 홈에 즉시 마운트될 때
  // 첫 프레임이 웹 레이아웃(paddingTop 56px)으로 깔렸다가 useEffect 후 네이티브 값으로 점프해
  // "상단이 잘렸다 스크롤하면 정상" 현상이 생긴다. lazy 초기화로 첫 프레임부터 올바른 값을 쓴다.
  // Capacitor 브리지는 앱 JS 실행 전에 주입되므로 첫 렌더 동기 계산으로 충분하다.
  const [isNative] = useState(() => {
    if (typeof window === 'undefined') return false
    return isCapacitorNative()
  })

  return isNative
}

