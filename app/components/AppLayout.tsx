'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/hooks/auth/useAuth'
import BottomNavigation from './BottomNavigation'
import SafeArea from './SafeArea'

const HIDE_NAV_PATHS = ['/login', '/add', '/auth', '/design-system', '/investment']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const hideNav =
    HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    (pathname === '/' && !user)

  return (
    <>
      <SafeArea
        hasBottomNav={!hideNav}
        // 하단 탭이 있는 화면(홈/통계/캘린더/설정 등)은 헤더에서 상단 safe area를 처리하므로 여기서는 비활성화
        disableTopPadding={!hideNav}
        className={hideNav ? '' : 'pb-20'}
      >
        {children}
      </SafeArea>
      {!hideNav && <BottomNavigation />}
    </>
  )
}
