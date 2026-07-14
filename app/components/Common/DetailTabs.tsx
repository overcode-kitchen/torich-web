'use client'

import { cn } from '@/lib/utils'
import { APP_HEADER_TOTAL_HEIGHT } from '@/app/constants/layout-constants'

export interface DetailTab {
  key: string
  label: string
}

export interface DetailTabsProps {
  tabs: DetailTab[]
  activeTab: string
  onTabClick: (tab: string) => void
  /**
   * 본문 가로 패딩만큼 끝까지 늘려 보더를 화면 폭에 맞추는 클래스.
   * 예: 본문이 px-6면 '-mx-6 px-6'.
   */
  bleedClassName: string
}

/**
 * 상세 화면 공용 섹션 탭바 (개요/정보/납입기록).
 * 헤더 바로 아래에 sticky로 붙고, role="tablist"/role="tab"/aria-selected로 보조기기에 탭임을 노출한다.
 * 주식 상세·예적금 상세가 동일 규격으로 사용한다.
 */
export function DetailTabs({ tabs, activeTab, onTabClick, bleedClassName }: DetailTabsProps) {
  return (
    <div
      className={cn('sticky z-40 bg-background border-b border-border-subtle-lighter', bleedClassName)}
      style={{ top: APP_HEADER_TOTAL_HEIGHT }}
      role="tablist"
    >
      <div className="flex gap-6">
        {tabs.map(({ key, label }) => {
          const selected = activeTab === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabClick(key)}
              className={cn(
                'py-3 text-sm font-medium transition-colors border-b-2',
                selected
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-foreground-subtle hover:text-foreground-soft',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
