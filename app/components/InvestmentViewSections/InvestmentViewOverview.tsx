'use client'

import { CalendarBlank } from '@phosphor-icons/react'
import { formatNextPaymentDate } from '@/app/utils/date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface InvestmentViewOverviewProps {
  title: string
  completed: boolean
  nextPaymentDate: Date | null
  overviewRef: React.RefObject<HTMLElement>
  titleRef: React.RefObject<HTMLDivElement>
}

export default function InvestmentViewOverview({
  title,
  completed,
  nextPaymentDate,
  overviewRef,
  titleRef,
}: InvestmentViewOverviewProps) {
  return (
    <section ref={overviewRef} className="py-6 space-y-4">
      <div ref={titleRef}>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          {title}
        </h2>
        {completed && (
          <p className="text-sm font-medium text-green-600">
            목표 달성! 🎉
          </p>
        )}
      </div>

      {/* 섹션 내비게이션 탭 */}
      <div className="sticky top-[52px] z-40 -mx-6 px-6 bg-background border-b border-border-subtle-lighter">
        <div className="flex gap-6">
          <button
            type="button"
            className="py-3 text-sm font-medium transition-colors border-b-2 border-foreground text-foreground"
          >
            개요
          </button>
          <button
            type="button"
            className="py-3 text-sm font-medium transition-colors border-b-2 border-transparent text-foreground-subtle hover:text-foreground-soft"
          >
            투자 정보
          </button>
          <button
            type="button"
            className="py-3 text-sm font-medium transition-colors border-b-2 border-transparent text-foreground-subtle hover:text-foreground-soft"
          >
            납입 기록
          </button>
        </div>
      </div>

      {nextPaymentDate && (
        <Alert className="mt-1 border-none bg-primary/10 text-foreground px-4 py-3 rounded-2xl">
          <CalendarBlank className="w-5 h-5 text-primary" />
          <div className="flex items-baseline justify-between gap-4 col-start-2 w-full">
            <div>
              <AlertTitle className="text-sm font-medium text-foreground-soft">
                다음 투자일
              </AlertTitle>
              <AlertDescription className="mt-0.5 text-base font-semibold text-primary">
                {formatNextPaymentDate(nextPaymentDate)}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </section>
  )
}
