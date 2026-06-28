'use client'

import { formatCurrency } from '@/lib/utils'
import { formatSmartDate, formatYearMonth, formatDuration } from '@/app/utils/date'
import { DetailHero } from '@/app/components/Common/DetailHero'
import { ProgressBar } from '@/app/components/Common/ProgressBar'

interface ProgressSectionProps {
  progress?: number | null
  completed?: boolean
  startDate?: Date
  endDate?: Date | null
  isHabitMode?: boolean
  elapsedMonths?: number
  totalPaidPrincipal?: number
}

export function ProgressSection({
  progress,
  completed = false,
  startDate,
  endDate,
  isHabitMode = false,
  elapsedMonths = 0,
  totalPaidPrincipal = 0,
}: ProgressSectionProps) {
  if (startDate === undefined) return null

  // 적립형: 총 납입액을 히어로로, streak는 보조줄로
  if (isHabitMode || !endDate) {
    const elapsedText =
      elapsedMonths > 0 ? `${formatDuration(elapsedMonths)}째 적립 중` : '이번 달부터 적립 시작'

    return (
      <div className="border-b border-border-subtle-lighter">
        <DetailHero
          label="총 납입액"
          amount={formatCurrency(totalPaidPrincipal)}
          sub={`🔥 ${elapsedText} · ${formatYearMonth(startDate)}부터`}
        />
      </div>
    )
  }

  // 목표형: 총 납입액 히어로 + 진행률 바
  if (progress === null || progress === undefined) return null

  return (
    <div className="border-b border-border-subtle-lighter">
      <DetailHero
        label="총 납입액"
        amount={formatCurrency(totalPaidPrincipal)}
        sub={completed ? '목표를 달성했어요 🎉' : undefined}
      >
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">진행률</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{progress}%</span>
          </div>
          <ProgressBar percent={progress} completed={completed} label="투자 진행률" />
          <div className="flex justify-between text-xs text-foreground-muted mt-2">
            <span>{formatSmartDate(startDate)}</span>
            <span>{formatSmartDate(endDate)}</span>
          </div>
        </div>
      </DetailHero>
    </div>
  )
}
