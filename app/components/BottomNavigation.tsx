'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, ChartBar, Calendar, Gear } from '@phosphor-icons/react'

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: House },
  { href: '/stats', label: '통계', icon: ChartBar },
  { href: '/calendar', label: '캘린더', icon: Calendar },
  { href: '/settings', label: '설정', icon: Gear },
] as const

export default function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border-subtle shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-3"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
      aria-label="하단 네비게이션"
    >
      <div className="flex items-stretch justify-around h-16 max-w-md mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 py-2 transition-colors ${
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
    </nav>
  )
}
