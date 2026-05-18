'use client'

export interface MonthlySummaryBarProps {
  /** 이번 달 납입 완료 건수 */
  completed: number
  /** 이번 달 전체 적립 항목 수 */
  total: number
}

/**
 * 홈 최상단 "이번 달 요약" 한 줄.
 * 완료 건수 + 얇은 진행 바.
 */
export function MonthlySummaryBar({ completed, total }: MonthlySummaryBarProps) {
  if (total === 0) return null
  const percent = Math.round((completed / total) * 100)

  return (
    <div className="px-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground-soft">
          이번 달 적립
        </span>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {completed}/{total} 완료
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full rounded-full bg-foreground-soft transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
