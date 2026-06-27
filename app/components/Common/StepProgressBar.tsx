'use client'

import { cn } from '@/lib/utils'

interface StepProgressBarProps {
  /** 현재 단계 (1부터 시작) */
  current: number
  /** 전체 단계 수 */
  total: number
  /** 컨테이너 추가 클래스 (너비·간격 등 레이아웃 커스터마이즈) */
  className?: string
}

/**
 * 토스 스타일 N분할 진행 바 — 추가 위저드(목적·적립항목)가 공통으로 사용.
 * 현재 단계와 그 이전 단계는 채워지고, 이후 단계는 비어 있다.
 * 채움색은 bg-foreground로 통일하고, 레이아웃(너비·간격)만 className으로 조정한다.
 */
export default function StepProgressBar({
  current,
  total,
  className,
}: StepProgressBarProps) {
  const filled = Math.max(0, Math.min(current, total))

  return (
    <div
      className={cn('flex items-center gap-2 mb-8', className)}
      role="progressbar"
      aria-label="진행 단계"
      aria-valuenow={filled}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={
            'h-1 flex-1 rounded-full transition-colors ' +
            (i < filled ? 'bg-foreground' : 'bg-muted')
          }
        />
      ))}
    </div>
  )
}
