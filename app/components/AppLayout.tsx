'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import BottomNavigation from './BottomNavigation'
import SafeArea from './SafeArea'

const HIDE_NAV_PATHS = [
  '/login',
  '/add',
  '/auth',
  '/design-system',
  '/investment',
  '/tory',
  '/notifications',
  '/goal',
  '/settings/notifications',
  '/settings/privacy',
  '/settings/terms',
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isNativeApp = useIsNativeApp()

  // iOS WKWebView 전용 교정.
  // 서브페이지(SubPageScaffold: h-[100dvh] overflow-hidden, 내부 컨테이너만 스크롤)에서
  // body 스크롤을 쓰는 홈(Dashboard: min-h-screen + fixed 헤더)으로 router.back() 하면,
  // WKWebView가 스크롤/레이아웃 메트릭을 즉시 재계산하지 않아 상단이 어긋난(잘린) 채로 그려지고
  // 사용자가 스크롤해야 정상으로 돌아온다. 홈 진입 직후 아주 작은 스크롤 넛지(1px→0)로
  // 그 재계산을 미리 유발해, 손으로 스크롤하기 전에 교정한다.
  // (웹 브라우저는 제때 재계산하므로 네이티브 앱에서만 적용. 홈 페이지는 라우터 캐시로
  //  복원되면 remount되지 않으므로, 항상 마운트된 AppLayout에서 pathname 변화로 감지한다.)
  useEffect(() => {
    if (!isNativeApp) return
    if (pathname !== '/') return
    // 스크롤 넛지(1px→0) + 강제 리플로우로 WKWebView가 레이아웃/스크롤 메트릭을 재계산하게 만든다.
    const kick = () => {
      window.scrollTo(0, 1)
      void document.documentElement.offsetHeight // 강제 리플로우
      window.scrollTo(0, 0)
    }
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      kick()
      raf2 = requestAnimationFrame(kick)
    })
    // 라우터 캐시로 홈이 rAF 시점보다 늦게 복원되는 기기 대비 지연 폴백.
    // 이미 사용자가 스크롤을 시작했으면 위치를 되돌리지 않도록 최상단일 때만 재교정한다.
    const timer = window.setTimeout(() => {
      if (window.scrollY <= 1) kick()
    }, 150)
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
      clearTimeout(timer)
    }
  }, [pathname, isNativeApp])
  const hideNav =
    HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    (pathname === '/' && !user)
  // 앱 스타일 상단 헤더(Safe Area + 48px 앱바)를 사용하는 화면 여부
  // - 메인 탭 화면(홈/통계/캘린더/설정 등)
  // - 투자 상세 등 상단 고정 앱바를 사용하는 화면
  // /add: SubPageScaffold가 safe area + 앱바를 처리하므로 SafeArea 상단 패딩 비활성화
  const usesAppHeader =
    !hideNav ||
    pathname.startsWith('/investment') ||
    pathname === '/add' ||
    pathname.startsWith('/add/') ||
    pathname === '/tory' ||
    pathname.startsWith('/tory/')

  // 하단 탭은 웹/앱 공통으로 hideNav가 아닐 때 항상 표시
  const showBottomNav = !hideNav

  return (
    <>
      <SafeArea
        hasBottomNav={showBottomNav}
        // 앱 스타일 상단 헤더가 있는 화면은 SafeArea에서 상단 패딩을 비활성화하고,
        // 각 화면 헤더가 직접 Safe Area + 앱바 높이를 처리한다.
        disableTopPadding={usesAppHeader}
      >
        {children}
      </SafeArea>
      {showBottomNav && <BottomNavigation />}
    </>
  )
}
