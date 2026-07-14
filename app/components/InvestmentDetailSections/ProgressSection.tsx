'use client'

import { formatCurrency } from '@/lib/utils'
import { formatKoreanDate, formatYearMonth, formatDuration } from '@/app/utils/date'
import { DetailHero } from '@/app/components/Common/DetailHero'
import { DetailProgressCard } from '@/app/components/Common/DetailProgressCard'

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

  // 적립형: 진행률 바 없이 총 납입액 히어로 + streak 보조줄
  if (isHabitMode || !endDate) {
    const elapsedText =
      elapsedMonths > 0 ? `${formatDuration(elapsedMonths)}째 적립 중` : '이번 달부터 적립 시작'

    return (
      <DetailHero
        label="총 납입액"
        amount={formatCurrency(totalPaidPrincipal)}
        sub={`🔥 ${elapsedText} · ${formatYearMonth(startDate)}부터`}
      />
    )
  }

  // 목표형: 회색 진행률 박스 + 총 납입액 히어로
  if (progress === null || progress === undefined) return null

  return (
    <>
      <DetailProgressCard
        percent={progress}
        completed={completed}
        startLabel={formatKoreanDate(startDate)}
        endLabel={formatKoreanDate(endDate)}
        status={
          completed ? (
            <p className="font-semibold text-success">🎉 목표를 달성했어요</p>
          ) : undefined
        }
        ariaLabel="적립 진행률"
      />
      <DetailHero
        className="pt-4"
        label="총 납입액"
        amount={formatCurrency(totalPaidPrincipal)}
      />
    </>
  )
}
