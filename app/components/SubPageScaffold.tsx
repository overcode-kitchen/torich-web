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
  /** 페이지 배경 클래스. 기본 'bg-surface'. 투자 상세처럼 흰색 톤이 필요하면 'bg-background' 전달. */
  surfaceClassName?: string
  /** 헤더 우측 액션 영역 (예: 더보기 메뉴) */
  actions?: ReactNode
  /** 헤더 중앙 슬롯 (예: 스크롤 시 나타나는 스티키 제목) */
  centerSlot?: ReactNode
  /** 본문 스크롤 컨테이너 ref (탭바 스크롤 점프 등에 사용) */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
  /** 진입 시 아래에서 스르륵 올라오는 페이드-인 애니메이션 (서랍을 당겨 들어오는 화면 등) */
  enterAnimation?: boolean
}

/**
 * 설정 탭(SettingsView)과 동일한 상단 앱바 규격(safe area + 48px 바).
 * 고정 헤더 + 본문만 스크롤(긴 폼에서도 뒤로가기 유지).
 */
export default function SubPageScaffold({
  onBack,
  children,
  contentClassName,
  surfaceClassName = 'bg-surface',
  actions,
  centerSlot,
  scrollContainerRef,
  enterAnimation = false,
}: SubPageScaffoldProps) {
  const isNativeApp = useIsNativeApp()

  const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
  const contentPaddingTop = isNativeApp
    ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)'
    : '56px'

  return (
    <div
      className={cn(
        'flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden',
        surfaceClassName,
        enterAnimation && 'animate-page-in',
      )}
    >
      {/* Settings와 동일한 '본문 시작' 높이 — 고정 헤더와 겹치지 않게 스페이서 */}
      <div className="shrink-0" style={{ height: contentPaddingTop }} aria-hidden />

      <header
        className={cn('fixed inset-x-0 top-0 z-30 w-full', surfaceClassName)}
        style={{ paddingTop: headerSafeTop }}
      >
        <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto pl-4 pr-2">
          <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 shrink-0 text-foreground-soft hover:text-foreground transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-6 h-6" weight="regular" />
            </button>
            <div className="min-w-0 flex-1 px-2">{centerSlot}</div>
            {actions && <div className="flex items-center shrink-0">{actions}</div>}
          </div>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
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
