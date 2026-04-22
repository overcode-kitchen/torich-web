'use client'

import { formatCurrency } from '@/lib/utils'
import { formatFullDate, formatYearMonth, formatDuration } from '@/app/utils/date'

import { useInvestmentDetailContext } from './InvestmentDetailContext'

interface ProgressSectionProps {
  progress?: number | null
  completed?: boolean
  startDate?: Date
  endDate?: Date | null
  isHabitMode?: boolean
  elapsedMonths?: number
  totalPaidPrincipal?: number
  calculatedFutureValue?: number
}

export function ProgressSection(props: ProgressSectionProps) {
  let contextValue: any = null
  try {
    contextValue = useInvestmentDetailContext()
  } catch (e) {
    // Context missing, will rely on props
  }

  const investmentData = contextValue?.investmentData

  const progress = props.progress ?? investmentData?.progress
  const completed = props.completed ?? investmentData?.completed
  const startDate = props.startDate ?? investmentData?.startDate
  const endDate = props.endDate ?? investmentData?.endDate
  const habit = props.isHabitMode ?? investmentData?.isHabitMode ?? false
  const elapsedMonths = props.elapsedMonths ?? investmentData?.elapsedMonths ?? 0
  const totalPaidPrincipal = props.totalPaidPrincipal ?? investmentData?.totalPaidPrincipal ?? 0
  const calculatedFutureValue =
    props.calculatedFutureValue ?? investmentData?.calculatedFutureValue ?? 0

  if (startDate === undefined) return null

  // 적립형: streak + 총 납입액 + 현재 예상 자산
  if (habit || !endDate) {
    const profit = calculatedFutureValue - totalPaidPrincipal
    const profitPct = totalPaidPrincipal > 0 ? (profit / totalPaidPrincipal) * 100 : 0
    const elapsedText = elapsedMonths > 0 ? `${formatDuration(elapsedMonths)}째 적립 중` : '이번 달부터 적립 시작'

    return (
      <section className="py-6 border-b border-border-subtle-lighter">
        <div className="mb-4">
          <p className="text-lg font-semibold text-foreground">
            🔥 {elapsedText}
          </p>
          <p className="text-sm text-foreground-subtle mt-1">
            {formatYearMonth(startDate)}부터 시작
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">총 납입액</span>
            <span className="text-base font-semibold text-foreground">
              {formatCurrency(totalPaidPrincipal)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">현재 예상 자산</span>
            <span className="text-base font-semibold text-foreground">
              {formatCurrency(Math.round(calculatedFutureValue))}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">수익률</span>
            <span className={`text-base font-semibold ${profitPct >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {profitPct >= 0 ? '+' : ''}
              {profitPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </section>
    )
  }

  // 목표형(기존 레이아웃)
  if (progress === null || progress === undefined) return null

  return (
    <section className="py-6 border-b border-border-subtle-lighter">
      <div className="flex justify-between text-base text-muted-foreground mb-3">
        <span className="font-medium">진행률</span>
        <span className="font-bold text-foreground">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-green-500' : 'bg-brand-500'
            }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-foreground-subtle mt-3">
        <span>시작: {formatFullDate(startDate)}</span>
        <span>종료: {formatFullDate(endDate)}</span>
      </div>
    </section>
  )
}
