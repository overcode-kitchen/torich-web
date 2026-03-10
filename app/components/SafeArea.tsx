import React from 'react'
import { cn } from '@/lib/utils'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'

interface SafeAreaProps {
  children: React.ReactNode
  /**
   * 하단 고정 네비게이션(또는 유사한 바)이 있는 화면인지 여부
   * - true: BottomNavigation이 자체적으로 safe-area-inset-bottom을 처리하므로 여기서는 bottom safe area를 추가하지 않음
   * - false: 콘텐츠 영역에서 safe-area-inset-bottom을 처리
   */
  hasBottomNav?: boolean
  className?: string
  /**
   * 상단 Safe Area 패딩을 비활성화할지 여부
   * - true: 상단 padding-top을 적용하지 않음 (헤더에서 별도 처리)
   * - false/undefined: 기본 상단 safe area + 여백 적용
   */
  disableTopPadding?: boolean
}

export default function SafeArea({ children, hasBottomNav, className, disableTopPadding }: SafeAreaProps) {
  const isNativeApp = useIsNativeApp()

  return (
    <div
      // SafeArea 자체에 배경색을 지정하면, 상단 padding 영역까지 같은 색으로 채워져서
      // 상태바(safe area)와 바로 아래 헤더가 시각적으로 하나의 블록처럼 보이게 된다.
      // 페이지에서 전달한 className 안에 bg- 클래스가 있다면 그 색을 우선 사용하고,
      // 없으면 기본으로 bg-surface를 사용한다.
      className={cn('bg-surface', className)}
      style={{
        // 웹 브라우저: 상태바 Safe Area가 없으므로 기본 여백만 적용
        // 네이티브 앱(Capacitor WebView): Safe Area inset + 기본 여백 적용
        paddingTop: disableTopPadding
          ? undefined
          : isNativeApp
            ? 'calc(env(safe-area-inset-top, 0px) + 24px)'
            : '24px',
        paddingBottom: hasBottomNav
          ? undefined
          : isNativeApp
            ? 'calc(env(safe-area-inset-bottom, 0px) + 24px)'
            : '24px',
      }}
    >
      {children}
    </div>
  )
}

