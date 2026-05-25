'use client'

import { CalendarBlank } from '@phosphor-icons/react'
import { Investment } from '@/app/types/investment'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatNextPaymentDate } from '@/app/utils/date'
import { formatCurrency } from '@/lib/utils'
import { getRecordAvatar } from '@/app/utils/recordAvatar'

interface InvestmentDetailOverviewProps {
  item: Investment
  isEditMode: boolean
  nextPaymentDate: Date | null
  completed: boolean
  overviewRef: React.RefObject<HTMLElement | null>
  titleRef: React.RefObject<HTMLDivElement | null>
}

function formatInvestmentSubtitle(item: Investment): string | null {
  if (item.unit_type === 'shares' && item.monthly_shares) {
    return `현재 ${item.monthly_shares}주씩 투자 중`
  }
  if (item.monthly_amount > 0) {
    return `현재 ${formatCurrency(item.monthly_amount)}씩 투자 중`
  }
  return null
}

export function InvestmentDetailOverview({
  item,
  isEditMode,
  nextPaymentDate,
  completed,
  overviewRef,
  titleRef,
}: InvestmentDetailOverviewProps) {
  const avatar = getRecordAvatar(item, 'lg')
  const subtitle = formatInvestmentSubtitle(item)

  return (
    <section ref={overviewRef} className="py-6 space-y-4">
      <div ref={titleRef}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${avatar.sizeClassName} ${avatar.className}`}
            aria-hidden
          >
            {avatar.label}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {item.title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
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
