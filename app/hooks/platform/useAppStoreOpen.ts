'use client'

import { useCallback } from 'react'

const APP_STORE_URL =
  'https://apps.apple.com/kr/app/%ED%86%A0%EB%A6%AC%EC%B9%98/id6761295498'

export function useAppStoreOpen() {
  const openAppStore = useCallback(async (): Promise<void> => {
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: APP_STORE_URL })
    } catch {
      if (typeof window !== 'undefined') {
        window.open(APP_STORE_URL, '_blank', 'noopener,noreferrer')
      }
    }
  }, [])

  return { openAppStore }
}
