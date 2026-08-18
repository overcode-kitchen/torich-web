'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, ChartBar, Calendar, Gear } from '@phosphor-icons/react'
import {
  APP_BOTTOM_NAV_BOTTOM_HEIGHT,
  APP_BOTTOM_NAV_ICON_ROW_PX,
  APP_BOTTOM_NAV_PADDING_TOP,
} from '@/app/constants/layout-constants'
import { hapticLightImpact } from '@/app/utils/haptics'

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: House },
  { href: '/calendar', label: '캘린더', icon: Calendar },
  { href: '/stats', label: '통계', icon: ChartBar },
  { href: '/settings', label: '설정', icon: Gear },
] as const

/**
 * 활성 탭을 다시 눌렀을 때 최상단으로 되돌린다.
 *
 * iOS 탭바의 학습된 기대(재탭 = 맨 위로)라, 없으면 긴 화면에서 손으로 쓸어 올리는 수밖에 없다.
 * 네 탭 모두 body 스크롤을 쓰므로(캘린더의 overflow-y-auto는 월 선택 모달 전용) window 스크롤만 다룬다.
 */
function scrollActiveTabToTop(): void {
  // 이미 맨 위면 스크롤도 햅틱도 건너뛴다 — 안 움직이는데 진동만 울리는 건 노이즈다
  if (window.scrollY <= 0) return

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  hapticLightImpact()
}

export default function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col border-t border-border-subtle bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      aria-label="하단 네비게이션"
    >
      <div aria-hidden className="w-full shrink-0" style={{ height: APP_BOTTOM_NAV_PADDING_TOP }} />

      <div
        className="flex items-center justify-around max-w-md mx-auto w-full shrink-0"
        style={{
          height: `${APP_BOTTOM_NAV_ICON_ROW_PX}px`,
          minHeight: `${APP_BOTTOM_NAV_ICON_ROW_PX}px`,
          maxHeight: `${APP_BOTTOM_NAV_ICON_ROW_PX}px`,
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 py-1 transition-colors ${
                isActive ? 'text-brand-600' : 'text-foreground-subtle'
              }`}
              aria-current={isActive ? 'page' : undefined}
              onClick={(e) => {
                // 다른 탭이면 평소대로 이동한다. 같은 탭은 라우터가 무시하므로 스크롤로 대신 응답한다
                if (!isActive) return
                e.preventDefault()
                scrollActiveTabToTop()
              }}
            >
              <Icon className="w-6 h-6 shrink-0" weight={isActive ? 'fill' : 'regular'} />
              <span className="text-caption font-medium truncate w-full text-center">{label}</span>
            </Link>
          )
        })}
      </div>

      <div aria-hidden className="w-full shrink-0" style={{ height: APP_BOTTOM_NAV_BOTTOM_HEIGHT }} />
    </nav>
  )
}
