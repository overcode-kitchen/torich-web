import React from 'react'
import { cn } from '@/lib/utils'

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
  /**
   * 하단 Safe Area 패딩을 비활성화할지 여부
   * - true: 하단 padding-bottom을 적용하지 않음 (화면 자체 스캐폴드가 처리)
   * - false/undefined: 기본 하단 safe area + 여백 적용
   *
   * 하단 탭이 없는(hasBottomNav=false) 서브페이지에서, 화면이 이미 자체적으로 하단 여백을
   * 넣는데 여기서 또 붙으면 세 가지가 한꺼번에 깨진다 — 패딩 중복 / 자식보다 큰 높이로 body
   * 스크롤 발생 / SafeArea 배경(bg-surface)이 자식 배경 밖으로 삐져나와 색 띠 노출.
   */
  disableBottomPadding?: boolean
}

export default function SafeArea({
  children,
  hasBottomNav,
  className,
  disableTopPadding,
  disableBottomPadding,
}: SafeAreaProps) {
  return (
    <div
      // SafeArea 자체에 배경색을 지정하면, 상단 padding 영역까지 같은 색으로 채워져서
      // 상태바(safe area)와 바로 아래 헤더가 시각적으로 하나의 블록처럼 보이게 된다.
      // 페이지에서 전달한 className 안에 bg- 클래스가 있다면 그 색을 우선 사용하고,
      // 없으면 기본으로 bg-surface를 사용한다.
      className={cn('bg-surface', className)}
      // env(safe-area-inset-*)는 웹에서 0으로 계산되므로 웹=16px/24px, 앱=노치+여백으로
      // 동일 수식이 양쪽을 모두 커버한다. isNativeApp 분기를 두면 서버(false)·클라(true)
      // 렌더가 달라져 하이드레이션 불일치가 나므로, JS 분기 없이 CSS env로만 처리한다.
      style={{
        paddingTop: disableTopPadding ? undefined : 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom:
          hasBottomNav || disableBottomPadding
            ? undefined
            : 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
    >
      {children}
    </div>
  )
}

