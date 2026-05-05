'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import ToryRaisingFullScreen from '@/app/components/ToryRaising/ToryRaisingFullScreen'

export default function ToryPage() {
  const isNativeApp = useIsNativeApp()
  const router = useRouter()

  const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
  const contentPaddingTop = isNativeApp
    ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px)'
    : '48px'

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <main
      className="h-[100dvh] bg-brand-50 overflow-hidden flex flex-col"
      style={{
        paddingTop: contentPaddingTop,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <header
        className="fixed inset-x-0 top-0 z-30 w-full bg-brand-50"
        style={{ paddingTop: headerSafeTop }}
      >
        <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto pl-4 pr-2">
          <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-1 text-foreground-soft hover:text-foreground transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-6 h-6" weight="regular" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 w-full">
        <ToryRaisingFullScreen />
      </div>
    </main>
  )
}
