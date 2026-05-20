'use client'

export interface MonthlySummaryBarProps {
  /** 이번 달 납입 완료 건수 */
  completed: number
  /** 이번 달 전체 적립 항목 수 */
  total: number
}

/**
 * 홈 최상단 "이번 달 요약" 한 줄.
 * 완료 건수만 슬림하게 보여준다.
 * (진행 막대바는 목적 카드의 진행률·항목별 완료 버튼과 중복이라 제외)
 */
export function MonthlySummaryBar({ completed, total }: MonthlySummaryBarProps) {
  if (total === 0) return null

  return (
    <div className="px-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground-soft">
          이번 달 적립
        </span>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {completed}/{total} 완료
        </span>
      </div>
      {completed === 0 && total > 0 && (
        <p className="mt-1.5 text-xs text-foreground-subtle">
          납입한 항목은 &lsquo;완료하기&rsquo;를 눌러 직접 체크해요
        </p>
      )}
    </div>
  )
}
