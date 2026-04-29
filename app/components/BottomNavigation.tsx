'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, ChartBar, Calendar, Gear, Sparkle } from '@phosphor-icons/react'
import {
  APP_BOTTOM_NAV_BOTTOM_HEIGHT,
  APP_BOTTOM_NAV_ICON_ROW_PX,
  APP_BOTTOM_NAV_PADDING_TOP,
} from '@/app/constants/layout-constants'

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: House },
  { href: '/calendar', label: '캘린더', icon: Calendar },
  { href: '/tory', label: '토리', icon: Sparkle },
  { href: '/stats', label: '통계', icon: ChartBar },
  { href: '/settings', label: '설정', icon: Gear },
] as const

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
            >
              <Icon className="w-6 h-6 shrink-0" weight={isActive ? 'fill' : 'regular'} />
              <span className="text-xs font-medium truncate w-full text-center">{label}</span>
            </Link>
          )
        })}
      </div>

      <div aria-hidden className="w-full shrink-0" style={{ height: APP_BOTTOM_NAV_BOTTOM_HEIGHT }} />
    </nav>
  )
}
