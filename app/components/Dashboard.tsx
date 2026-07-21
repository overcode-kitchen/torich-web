'use client'

import type { Investment } from '@/app/types/investment'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'
import Header from './DashboardSections/Header'
import NotificationInbox from './DashboardSections/NotificationInbox'
import DashboardContent from './DashboardSections/DashboardContent'

/** 메인 앱바 우측 알림함 아이콘. 추후 노출 시 true로 변경 */
const SHOW_NOTIFICATION_INBOX = false

export interface DashboardProps {
  records: Investment[]
  totalMonthlyPayment: number

  showMonthlyAmount: boolean
  onToggleMonthlyAmount: () => void

  showBrandStoryCard: boolean
  onCloseBrandStoryCard: () => void
  pendingBrandStoryUndo: boolean
  onUndoBrandStory: () => void
  isBrandStoryOpen: boolean
  onOpenBrandStory: () => void
  onCloseBrandStory: () => void
}

export default function Dashboard({
  records,
  totalMonthlyPayment,
  showMonthlyAmount,
  onToggleMonthlyAmount,
  showBrandStoryCard,
  onCloseBrandStoryCard,
  pendingBrandStoryUndo,
  onUndoBrandStory,
  isBrandStoryOpen,
  onOpenBrandStory,
  onCloseBrandStory,
}: DashboardProps) {
  const isNativeApp = useIsNativeApp()

  const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
  const contentPaddingTop = isNativeApp
    ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)'
    : '56px'

  return (
    <main
      className="min-h-screen bg-surface"
      style={{
        // 앱바 실제 높이(safe area + 48px) + 여유 8px
        paddingTop: contentPaddingTop,
        paddingBottom: APP_TAB_CONTENT_PADDING_BOTTOM,
      }}
    >
      {/* 앱바: 상태바 아래 패딩 + 정확히 48px 높이의 바 (로고·알림) */}
      <header
        className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
        style={{
          paddingTop: headerSafeTop,
        }}
      >
        <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
          <Header
            rightSlot={SHOW_NOTIFICATION_INBOX ? <NotificationInbox /> : undefined}
          />
        </div>
        {/* 스크롤 콘텐츠가 헤더 아래로 자연스럽게 사라지도록 하단 페이드 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-full h-6"
          style={{
            background:
              'linear-gradient(to bottom, var(--surface) 0%, color-mix(in srgb, var(--surface) 60%, transparent) 50%, transparent 100%)',
          }}
        />
      </header>

      <DashboardContent
        data={{
          records,
          totalMonthlyPayment,
        }}
        brandStory={{
          showBrandStoryCard,
          onCloseBrandStoryCard,
          pendingBrandStoryUndo,
          onUndoBrandStory,
          isBrandStoryOpen,
          onOpenBrandStory,
          onCloseBrandStory,
        }}
        settings={{
          showMonthlyAmount,
          onToggleMonthlyAmount,
        }}
      />
    </main>
  )
}
