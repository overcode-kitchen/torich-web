'use client'

import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { PaymentEvent } from '@/app/utils/stats'

function formatEventContribution(e: PaymentEvent): string {
  if (e.unitType === 'shares' && e.monthlyShares && e.monthlyShares > 0) {
    return `${e.monthlyShares}주`
  }
  return formatCurrency(e.monthlyAmount)
}

function formatRelativeDate(date: Date, today: Date): string {
  if (isSameDay(date, today)) return '오늘'
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, tomorrow)) return '내일'
  return format(date, 'M월 d일 (E)', { locale: ko })
}

interface UpcomingEventsSectionProps {
  upcomingEvents: PaymentEvent[]
  handleComplete: (event: PaymentEvent) => void
}

export function UpcomingEventsSection({
  upcomingEvents,
  handleComplete,
}: UpcomingEventsSectionProps) {
  const router = useRouter()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const goToDetail = (investmentId: string) => {
    router.push(`/investment?id=${investmentId}`)
  }

  return (
    <div
      className="bg-card rounded-2xl p-4"
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <h3 className="text-sm font-semibold text-foreground-soft mb-3">
        다가오는 납입
      </h3>
      {upcomingEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">예정된 납입이 없어요</p>
      ) : (
        <div>
          {upcomingEvents.map((e, idx) => {
            const eventDate = new Date(e.year, e.month - 1, e.day)
            const isLast = idx === upcomingEvents.length - 1
            return (
              <div key={`${e.year}-${e.month}-${e.day}-${e.investmentId}`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => goToDetail(e.investmentId)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      goToDetail(e.investmentId)
                    }
                  }}
                  className="flex items-center justify-between py-3 cursor-pointer transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${e.title} 상세 보기`}
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {formatRelativeDate(eventDate, today)}
                    </p>
                    <p className="font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-sm text-muted-foreground">{formatEventContribution(e)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      handleComplete(e)
                    }}
                    className="shrink-0 ml-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                    aria-label="납입 완료 체크"
                  >
                    완료하기
                  </button>
                </div>
                {!isLast && (
                  <div aria-hidden className="h-px bg-border-subtle-lighter" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
