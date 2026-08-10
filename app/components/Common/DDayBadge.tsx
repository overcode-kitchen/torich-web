import { cn } from '@/lib/utils'

export interface DDayBadgeProps {
  /** 표시할 라벨 (예: "D-130", "D-DAY") */
  label: string
  className?: string
}

/**
 * 목적 카드·통계에서 공통으로 쓰는 D-day 표기.
 * 알약 박스 없이 작고(11px) 굵은(semibold) 옅은 회색 텍스트 — 배포본보다 작게,
 * 단 얇지 않게. 홈 목적 카드(GoalGroupCard)와 통계 목적 진척 섹션이 함께 쓴다.
 */
export function DDayBadge({ label, className }: DDayBadgeProps) {
  return (
    <span
      className={cn(
        'shrink-0 text-micro font-semibold text-foreground-soft tabular-nums',
        className,
      )}
    >
      {label}
    </span>
  )
}
