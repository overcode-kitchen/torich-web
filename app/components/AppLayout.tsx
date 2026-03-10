'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/hooks/auth/useAuth'
import BottomNavigation from './BottomNavigation'
import SafeArea from './SafeArea'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'

const HIDE_NAV_PATHS = ['/login', '/add', '/auth', '/design-system', '/investment']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isNativeApp = useIsNativeApp()
  const hideNav =
    HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    (pathname === '/' && !user)
  // 앱 스타일 상단 헤더(Safe Area + 48px 앱바)를 사용하는 화면 여부
  // - 메인 탭 화면(홈/통계/캘린더/설정 등)
  // - 투자 상세 등 상단 고정 앱바를 사용하는 화면
  const usesAppHeader = !hideNav || pathname.startsWith('/investment')

  // 하단 탭은 웹/앱 공통으로 hideNav가 아닐 때 항상 표시
  const showBottomNav = !hideNav

  return (
    <>
      <SafeArea
        hasBottomNav={showBottomNav}
        // 앱 스타일 상단 헤더가 있는 화면은 SafeArea에서 상단 패딩을 비활성화하고,
        // 각 화면 헤더가 직접 Safe Area + 앱바 높이를 처리한다.
        disableTopPadding={usesAppHeader}
        className={usesAppHeader ? 'pb-20' : ''}
      >
        {children}
      </SafeArea>
      {showBottomNav && <BottomNavigation />}
    </>
  )
}
