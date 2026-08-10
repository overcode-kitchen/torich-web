import { cn } from '@/lib/utils'

export interface DDayBadgeProps {
  /** 표시할 라벨 (예: "D-130", "D-DAY") */
  label: string
  className?: string
}

/**
 * 목적 카드·통계에서 공통으로 쓰는 D-day 표기.
 * 배포본(main GoalCard)의 스타일 그대로 — 배경·패딩·볼드 없는 옅은 회색 텍스트.
 * 배포본의 `text-sm text-muted-foreground`를 토큰(text-label)으로만 옮겼다.
 * 홈 목적 카드(GoalGroupCard)와 통계 목적 진척 섹션이 함께 쓴다.
 */
export function DDayBadge({ label, className }: DDayBadgeProps) {
  return (
    <span
      className={cn(
        'shrink-0 text-label text-muted-foreground tabular-nums',
        className,
      )}
    >
      {label}
    </span>
  )
}
