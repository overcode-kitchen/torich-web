'use client'

import { CalendarBlank } from '@phosphor-icons/react'
import { Investment } from '@/app/types/investment'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatNextPaymentDate } from '@/app/utils/date'

interface InvestmentDetailOverviewProps {
  item: Investment
  isEditMode: boolean
  nextPaymentDate: Date | null
  completed: boolean
  overviewRef: React.RefObject<HTMLElement | null>
  titleRef: React.RefObject<HTMLDivElement | null>
}

export function InvestmentDetailOverview({
  item,
  isEditMode,
  nextPaymentDate,
  completed,
  overviewRef,
  titleRef,
}: InvestmentDetailOverviewProps) {
  return (
    <section ref={overviewRef} className="py-6 space-y-4">
      <div ref={titleRef}>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          {item.title}
        </h2>
        {isEditMode ? (
          <p className="text-sm text-foreground-subtle">종목명은 수정할 수 없습니다</p>
        ) : (
          completed && (
            <p className="text-sm font-medium text-green-600">
              목표 달성! 🎉
            </p>
          )
        )}
      </div>
      {!isEditMode && nextPaymentDate && (
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
