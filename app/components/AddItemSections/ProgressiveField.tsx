'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { PencilSimple } from '@phosphor-icons/react'

interface ProgressiveFieldProps {
  /** 질문 라벨 (예: "어떤 유형으로 모을까요?") */
  label: string
  /** 답변 요약 (비활성 상태에서 표시) */
  answerSummary?: string
  /** 이 필드가 현재 활성 입력 단계인가 */
  isActive: boolean
  /** 답변 요약을 탭하면 호출 — 해당 필드 step으로 되돌아 가기 */
  onEditTap?: () => void
  /** 활성일 때 노출되는 입력 UI */
  children: ReactNode
}

/**
 * 토스 스타일 progressive disclosure 필드 wrapper.
 * - 비활성: 라벨 + 답변 요약 + 연필 아이콘 (탭 시 편집 진입)
 * - 활성: 라벨 + 자식 입력 UI 노출
 * - 활성 진입 시 자동으로 viewport에 스크롤
 */
export default function ProgressiveField({
  label,
  answerSummary,
  isActive,
  onEditTap,
  children,
}: ProgressiveFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isActive])

  if (!isActive) {
    return (
      <button
        type="button"
        onClick={onEditTap}
        disabled={!onEditTap}
        className="w-full text-left flex items-start justify-between gap-3 py-3 border-b border-border-subtle hover:bg-muted/30 transition-colors disabled:cursor-default"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground-subtle mb-1">{label}</p>
          {answerSummary ? (
            <p className="text-base text-foreground truncate">{answerSummary}</p>
          ) : (
            <p className="text-base text-foreground-soft italic">아직 입력하지 않음</p>
          )}
        </div>
        {onEditTap && (
          <PencilSimple
            className="mt-1 h-4 w-4 text-foreground-subtle"
            aria-hidden="true"
          />
        )}
      </button>
    )
  }

  return (
    <div ref={containerRef} className="py-4">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        {label}
      </h2>
      <div>{children}</div>
    </div>
  )
}
