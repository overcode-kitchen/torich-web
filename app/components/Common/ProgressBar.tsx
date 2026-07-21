'use client'

import { cn } from '@/lib/utils'

export interface ProgressBarProps {
  /** 0~100+ 값. 표시 폭은 0~100으로 클램프된다. */
  percent: number
  /** 완료 시 채움색을 성공 톤으로 */
  completed?: boolean
  /** 스크린리더용 라벨 (예: "진행률") */
  label?: string
  className?: string
}

/**
 * 상세 화면 공용 진행률 바.
 * 목적 상세·투자 상세에서 동일 규격으로 사용한다.
 * role="progressbar" + aria-value* 로 보조기기에 진행률을 노출한다.
 */
export function ProgressBar({ percent, completed = false, label = '진행률', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(percent, 100))

  return (
    <div
      className={cn('w-full h-1.5 bg-surface-hover rounded-full overflow-hidden', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          completed ? 'bg-success' : 'bg-brand-500',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
