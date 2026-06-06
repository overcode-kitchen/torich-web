'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface ProgressiveFieldProps {
  /** 질문 라벨 (예: "어떤 유형으로 모을까요?") */
  label: string
  /** 입력 UI */
  children: ReactNode
  /** 마운트 시 viewport 중앙으로 자동 스크롤할지 (기본 true) */
  autoScroll?: boolean
}

/**
 * 토스 스타일 progressive disclosure 필드 wrapper.
 * 이전 필드가 채워졌을 때 부모가 조건부 렌더하므로 마운트 = 노출 시점.
 * 마운트 시 자동으로 뷰포트 중앙으로 스크롤한다.
 */
export default function ProgressiveField({
  label,
  children,
  autoScroll = true,
}: ProgressiveFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [autoScroll])

  return (
    <div ref={containerRef} className="py-4">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        {label}
      </h2>
      <div>{children}</div>
    </div>
  )
}
