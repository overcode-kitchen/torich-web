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
  // v2 프로토타입은 자체 탭바(홈·설정 2개)를 갖는다 — 기존 4탭을 겹쳐 그리지 않는다.
  '/v2',
]

/**
 * 자체 스캐폴드(SubPageScaffold 등)가 safe area를 직접 처리하는 경로.
 * 여기 없는 화면만 SafeArea가 상·하단 패딩을 대신 넣는다.
 *
 * 빠뜨리면 safe area가 이중으로 얹힌다. 상단은 여백이 벌어지고(#180), 하단은 SafeArea 배경이
 * 자식 배경 밖으로 삐져나와 색 띠가 드러난다(#192). 둘 다 웹에서는 env()가 0이라 16·24px만
 * 더해져 잘 드러나지 않고 노치 기기에서만 커지므로, 새 서브페이지를 만들면 여기 등록부터 한다.
 *
 * /notifications는 SubPageScaffold를 쓰지 않고 SafeArea 패딩에 기대므로 제외한다.
 */
const OWN_SCAFFOLD_PATHS = [
  '/investment',
  '/add',
  '/goal',
  '/tory',
  '/faq',
  '/settings/notifications',
  '/settings/privacy',
  '/settings/terms',
  '/v2',
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
  // 화면이 safe area를 자기 스캐폴드로 처리하는지 여부.
  // - 메인 탭 화면(홈/통계/캘린더/설정 등)은 자체 앱바가 있다
  // - 서브페이지는 SubPageScaffold가 상단 safe area + 앱바와 하단 여백을 모두 넣는다
  const usesOwnScaffold =
    !hideNav ||
    OWN_SCAFFOLD_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  // 하단 탭은 웹/앱 공통으로 hideNav가 아닐 때 항상 표시
  const showBottomNav = !hideNav

  return (
    <>
      <SafeArea
        hasBottomNav={showBottomNav}
        // 자체 스캐폴드가 있는 화면은 상·하단 모두 SafeArea가 손대지 않는다.
        // 한쪽만 끄면 반대쪽에 이중 적용이 남는다 — #180(상단)을 고친 뒤 하단이 그대로 남아
        // 회색 띠로 드러난 것이 #192다.
        disableTopPadding={usesOwnScaffold}
        disableBottomPadding={usesOwnScaffold}
      >
        {children}
      </SafeArea>
      {showBottomNav && <BottomNavigation />}
    </>
  )
}
