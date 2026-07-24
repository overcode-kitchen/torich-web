import { cn } from '@/lib/utils'

export interface DDayBadgeProps {
  /** 표시할 라벨 (예: "D-130", "D-DAY") */
  label: string
  className?: string
}

/**
 * 목적 카드·통계에서 공통으로 쓰는 D-day 배지.
 * 홈 목적 카드(GoalGroupCard)와 통계 목적 진척 섹션이 동일 규격으로 사용한다.
 */
export function DDayBadge({ label, className }: DDayBadgeProps) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-md bg-surface-hover px-2 py-0.5 text-[11px] font-semibold text-foreground-soft tabular-nums',
        className,
      )}
    >
      {label}
    </span>
  )
}
