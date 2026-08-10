import { cn } from '@/lib/utils'

export interface DDayBadgeProps {
  /** 표시할 라벨 (예: "D-130", "D-DAY") */
  label: string
  className?: string
}

/**
 * 목적 카드·통계에서 공통으로 쓰는 D-day 표기.
 * 배포본(main GoalCard)의 은은한 민짜 텍스트를 규격으로 삼는다 — 배경·패딩 없는
 * 옅은 회색 소형 텍스트. 홈 목적 카드(GoalGroupCard)와 통계 목적 진척 섹션이 함께 쓴다.
 */
export function DDayBadge({ label, className }: DDayBadgeProps) {
  return (
    <span
      className={cn(
        'shrink-0 text-micro text-muted-foreground tabular-nums',
        className,
      )}
    >
      {label}
    </span>
  )
}
