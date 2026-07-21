'use client'

import { formatCurrency } from '@/lib/utils'
import { formatKoreanDate, formatYearMonth, formatDuration } from '@/app/utils/date'
import { DetailHero } from '@/app/components/Common/DetailHero'

interface ProgressSectionProps {
  progress?: number | null
  completed?: boolean
  startDate?: Date
  endDate?: Date | null
  isHabitMode?: boolean
  elapsedMonths?: number
  totalPaidPrincipal?: number
  /** 금액 히어로 아래 보조 줄 (예: "현재 10만원씩 투자 중"). 이름 블록을 앱바로 올린 뒤 맥락 유지용. */
  contextLine?: string | null
}

export function ProgressSection({
  progress,
  completed = false,
  startDate,
  endDate,
  isHabitMode = false,
  elapsedMonths = 0,
  totalPaidPrincipal = 0,
  contextLine,
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
        context={contextLine}
        sub={`🔥 ${elapsedText} · ${formatYearMonth(startDate)}부터`}
      />
    )
  }

  // 목표형: 총 납입액 히어로 하나에 기간 진행 바를 종속시킨다.
  // 바는 '시간' 진행(시작~만기)이라 % 텍스트 대신 양 끝 날짜만 앵커로 두어
  // "돈 진행률"로 오독되지 않게 한다.
  if (progress === null || progress === undefined) return null

  return (
    <DetailHero
      label="총 납입액"
      amount={formatCurrency(totalPaidPrincipal)}
      context={contextLine}
      progress={{
        percent: progress,
        completed,
        startLabel: formatKoreanDate(startDate),
        endLabel: formatKoreanDate(endDate),
        ariaLabel: '적립 진행률',
      }}
      sub={completed ? <span className="font-semibold text-success">🎉 목표를 달성했어요</span> : undefined}
    />
  )
}
