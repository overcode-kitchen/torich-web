'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DetailHeaderTitleProps {
  /** 제목 왼쪽 소형 비주얼 (종목 아바타 원 / 목적 아이콘). h-6 w-6 규격 권장. 생략 가능 */
  leading?: ReactNode
  /** 제목 텍스트 */
  title: string
  /**
   * 제목 탭 시 호출 (예적금: 필드 편집 진입). 제공 시 button으로 렌더된다.
   * 목적·투자는 편집이 우측 더보기 메뉴에 있으므로 생략한다.
   */
  onClick?: () => void
}

/**
 * 상세(조회) 화면 상단 앱바 중앙에 상주하는 제목.
 * "돈이 주인공"인 상세에서 이름을 본문 히어로와 경쟁시키지 않고 앱바로 올려,
 * 본문 최상단을 금액 히어로 하나로 유지한다. 뒤로가기 옆에 좌측 정렬한다.
 */
export function DetailHeaderTitle({ leading, title, onClick }: DetailHeaderTitleProps) {
  const inner = (
    <>
      {leading}
      <span className="truncate text-base font-semibold tracking-tight text-foreground">
        {title}
      </span>
    </>
  )

  const className = 'flex min-w-0 items-center gap-2'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, 'max-w-full text-left')}>
        {inner}
      </button>
    )
  }

  return <span className={className}>{inner}</span>
}
