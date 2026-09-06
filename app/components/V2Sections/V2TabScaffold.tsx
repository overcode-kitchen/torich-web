'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { House, GearSix } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface V2TabScaffoldProps {
  current: 'home' | 'settings'
  children: ReactNode
}

const TABS = [
  { key: 'home', href: '/v2', label: '홈', Icon: House },
  { key: 'settings', href: '/v2/settings', label: '설정', Icon: GearSix },
] as const

/**
 * v2 탭 화면 껍데기 — 탭은 홈·설정 2개다(N-16).
 * env(safe-area-inset-*)는 웹에서 0이라 웹/앱이 같은 수식으로 커버된다.
 */
export default function V2TabScaffold({ current, children }: V2TabScaffoldProps) {
  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-surface">
      <div
        className="shrink-0"
        style={{ height: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        aria-hidden
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-6 md:max-w-lg">
          {children}
        </div>
      </div>

      <nav
        className="shrink-0 border-t border-border-subtle bg-card"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex h-16 w-full max-w-md md:max-w-lg">
          {TABS.map(({ key, href, label, Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={current === key ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-micro',
                current === key ? 'font-bold text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" weight={current === key ? 'fill' : 'regular'} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
