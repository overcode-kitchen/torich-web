'use client'

import { useCallback } from 'react'
import { Share } from '@capacitor/share'
import { useDailyContent } from '@/app/hooks/tory/useDailyContent'
import RichQuoteCard from '@/app/components/RichQuoteCard'
import ToryPageSkeleton from '@/app/components/ToryPageSkeleton'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'
import { toastError } from '@/app/utils/toast'

const SHARE_FAIL_MESSAGE = '공유에 실패했어요. 잠시 후 다시 시도해 주세요.'

function isUserCancelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const lower = message.toLowerCase()
  return lower.includes('cancel') || lower.includes('abort') || lower.includes('dismiss')
}

export default function ToryPage() {
  const { richQuote, isLoading } = useDailyContent()
  const isNativeApp = useIsNativeApp()

  const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
  const contentPaddingTop = isNativeApp
    ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)'
    : '56px'

  const handleShare = useCallback(async (): Promise<void> => {
    if (!richQuote) return
    try {
      await Share.share({
        text: `"${richQuote.text}" - ${richQuote.author}\n\n토리치에서 매일 명언 받기 👉 https://torich.app`,
      })
    } catch (error) {
      if (isUserCancelError(error)) return
      toastError(SHARE_FAIL_MESSAGE)
    }
  }, [richQuote])

  return (
    <main
      className="min-h-screen bg-surface"
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

      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto w-full px-4 py-3 flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm text-foreground-muted">
          <span role="img" aria-label="호랑이 토리">🐯</span>
          <span>토리가 골라준 오늘의 명언</span>
        </p>

        {isLoading ? (
          <ToryPageSkeleton />
        ) : (
          richQuote && (
            <RichQuoteCard
              text={richQuote.text}
              author={richQuote.author}
              onShare={handleShare}
            />
          )
        )}
      </div>
    </main>
  )
}
