'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DetailTitleBlockProps {
  /** 제목 왼쪽 비주얼 (목적: 아이콘 이미지 / 투자: 아바타 원). 생략 가능 */
  leading?: ReactNode
  /** 제목 텍스트 */
  title: string
  /** 제목 아래 한 줄 요약 (예: "현재 10만원씩 투자 중"). 생략 시 제목만 노출 */
  subtitle?: ReactNode
  /**
   * 제목 줄바꿈 처리.
   * - 'truncate'(기본): 한 줄로 자름 (투자 종목명 등)
   * - 'wrap': 여러 줄 허용 + 한국어 단어 단위 줄바꿈 (목적 이름 등)
   */
  titleWrap?: 'truncate' | 'wrap'
  /** flex 행에 추가할 클래스 (예: 아래 여백 mb-2) */
  className?: string
}

/**
 * 상세(조회) 화면 제목 행 — 선행 비주얼 + 제목(+선택 서브타이틀).
 * 목적 상세·주식/예적금 상세가 동일 규격으로 사용해 타이포·간격을 통일한다.
 * 감싸는 섹션 여백·ref·탭 동작(제목 클릭 편집 등)·부가 문구는 호출부가 소유한다.
 */
export function DetailTitleBlock({
  leading,
  title,
  subtitle,
  titleWrap = 'truncate',
  className,
}: DetailTitleBlockProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {leading}
      <div className="min-w-0 flex-1">
        <h2
          className={cn(
            'text-xl font-semibold tracking-tight text-foreground',
            titleWrap === 'wrap' ? 'break-keep' : 'truncate',
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
