'use client'

import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'
import ToryRaisingFullScreen from '@/app/components/ToryRaising/ToryRaisingFullScreen'

export default function ToryPage() {
  const isNativeApp = useIsNativeApp()

  const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
  const contentPaddingTop = isNativeApp
    ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)'
    : '56px'

  return (
    <main
      className="h-[100dvh] bg-surface overflow-hidden"
      style={{
        paddingTop: contentPaddingTop,
        paddingBottom: APP_TAB_CONTENT_PADDING_BOTTOM,
      }}
    >
      <header
        className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
        style={{ paddingTop: headerSafeTop }}
      >
        <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4">
          <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
            <h1 className="text-xl font-bold text-foreground">토리</h1>
          </div>
        </div>
      </header>

      <div className="w-full h-full">
        <ToryRaisingFullScreen />
      </div>
    </main>
  )
}
