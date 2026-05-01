'use client'

import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'
import ToryRaisingFullScreen from '@/app/components/ToryRaising/ToryRaisingFullScreen'

export default function ToryPage() {
  const isNativeApp = useIsNativeApp()

  const contentPaddingTop = isNativeApp
    ? 'max(env(safe-area-inset-top, 0px), 44px)'
    : '0px'

  return (
    <main
      className="h-[100dvh] bg-brand-50 overflow-hidden"
      style={{
        paddingTop: contentPaddingTop,
        paddingBottom: APP_TAB_CONTENT_PADDING_BOTTOM,
      }}
    >
      <div className="w-full h-full">
        <ToryRaisingFullScreen />
      </div>
    </main>
  )
}
