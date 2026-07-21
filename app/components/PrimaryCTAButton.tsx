'use client'

import { CircleNotch } from '@phosphor-icons/react'

interface PrimaryCTAButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
}

/**
 * 하단 고정 CTA / 폼 저장 버튼 공용 컴포넌트.
 * - 색상: 브랜드 그린 (`bg-primary`)
 * - 로딩 시 spinner + loadingLabel 노출
 */
export default function PrimaryCTAButton({
  label,
  onClick,
  disabled = false,
  loading = false,
  loadingLabel,
}: PrimaryCTAButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full bg-primary text-primary-foreground font-medium rounded-xl py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <CircleNotch className="w-5 h-5 animate-spin" />
          <span>{loadingLabel ?? '처리 중...'}</span>
        </>
      ) : (
        label
      )}
    </button>
  )
}
