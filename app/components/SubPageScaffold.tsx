'use client'

import type { ReactNode } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'
import { cn } from '@/lib/utils'

export interface SubPageScaffoldProps {
  onBack: () => void
  children: ReactNode
  /** 스크롤 영역 내부 래퍼에 추가 class (예: py-6) */
  contentClassName?: string
}

/**
 * 설정 탭(SettingsView)과 동일한 상단 앱바 규격(safe area + 48px 바).
 * 고정 헤더 + 본문만 스크롤(긴 폼에서도 뒤로가기 유지).
 */
export default function SubPageScaffold({ onBack, children, contentClassName }: SubPageScaffoldProps) {
  const isNativeApp = useIsNativeApp()

  const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
  const contentPaddingTop = isNativeApp
    ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)'
    : '56px'

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-surface">
      {/* Settings와 동일한 '본문 시작' 높이 — 고정 헤더와 겹치지 않게 스페이서 */}
      <div className="shrink-0" style={{ height: contentPaddingTop }} aria-hidden />

      <header
        className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
        style={{ paddingTop: headerSafeTop }}
      >
        <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto pl-4 pr-2">
          <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 text-foreground-soft hover:text-foreground transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-6 h-6" weight="regular" />
            </button>
          </div>
        </div>
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        style={{ paddingBottom: APP_TAB_CONTENT_PADDING_BOTTOM }}
      >
        <div className={cn('mx-auto w-full max-w-md md:max-w-lg lg:max-w-2xl px-4', contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  )
}
