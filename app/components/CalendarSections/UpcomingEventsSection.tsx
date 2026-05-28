'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { PaymentEvent } from '@/app/utils/stats'
import type { Investment } from '@/app/types/investment'
import { formatMonthlyContribution } from '@/app/utils/investment-display'
import { getInvestmentAvatarLabel } from '@/app/utils/investmentAvatarLabel'

function formatRelativeDate(date: Date, today: Date): string {
  if (isSameDay(date, today)) return '오늘'
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, tomorrow)) return '내일'
  return format(date, 'M월 d일 (E)', { locale: ko })
}

interface DateGroup {
  date: Date
  events: PaymentEvent[]
}

function groupByDate(events: PaymentEvent[]): DateGroup[] {
  const map = new Map<string, DateGroup>()
  for (const e of events) {
    const key = `${e.year}-${e.month}-${e.day}`
    const existing = map.get(key)
    if (existing) {
      existing.events.push(e)
    } else {
      map.set(key, { date: new Date(e.year, e.month - 1, e.day), events: [e] })
    }
  }
  return Array.from(map.values())
}

interface UpcomingEventsSectionProps {
  upcomingEvents: PaymentEvent[]
  records: Investment[]
  handleComplete: (event: PaymentEvent) => void
}

export function UpcomingEventsSection({
  upcomingEvents,
  records,
  handleComplete,
}: UpcomingEventsSectionProps) {
  const router = useRouter()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const investmentMap = useMemo(() => {
    const map = new Map<string, Investment>()
    for (const r of records) map.set(r.id, r)
    return map
  }, [records])

  const groups = groupByDate(upcomingEvents)

  const goToDetail = (investmentId: string) => {
    router.push(`/investment?id=${investmentId}`)
  }

  return (
    <div
      className="bg-card rounded-2xl p-4"
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      {upcomingEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">예정된 납입이 없어요</p>
      ) : (
        <div>
          {groups.map(({ date, events }) => (
            <section key={date.toISOString()}>
              <h4 className="sticky top-0 z-10 -mx-4 px-4 bg-card py-1.5 text-xs font-medium text-foreground-subtle">
                {formatRelativeDate(date, today)}
              </h4>
              {events.map((e) => {
                const investment = investmentMap.get(e.investmentId)
                const contribution = investment
                  ? formatMonthlyContribution(investment).main
                  : null
                const isUS = investment?.market === 'US'
                return (
                  <div
                    key={`${e.year}-${e.month}-${e.day}-${e.investmentId}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => goToDetail(e.investmentId)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        goToDetail(e.investmentId)
                      }
                    }}
                    className="flex items-center justify-between gap-3 py-2.5 cursor-pointer transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${e.title} 상세 보기`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isUS
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)]'
                        }`}
                      >
                        {getInvestmentAvatarLabel(e.title)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-foreground truncate">
                          {e.title}
                        </p>
                        {contribution && (
                          <p className="text-sm text-muted-foreground truncate">
                            {contribution}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        handleComplete(e)
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                      aria-label="납입 완료 체크"
                    >
                      완료하기
                    </button>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
