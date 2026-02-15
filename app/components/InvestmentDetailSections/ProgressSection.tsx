'use client'

import { formatFullDate } from '@/app/utils/date'

import { useInvestmentDetailContext } from './InvestmentDetailContext'

interface ProgressSectionProps {
  progress?: number
  completed?: boolean
  startDate?: Date
  endDate?: Date
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

  if (progress === undefined || startDate === undefined || endDate === undefined) return null

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
