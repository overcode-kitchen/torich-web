'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { PaymentEvent } from '@/app/utils/stats'
import type { Investment } from '@/app/types/investment'
import { PaymentEventRow } from './PaymentEventRow'

function formatRelativeDate(date: Date, today: Date): string {
  if (isSameDay(date, today)) return '오늘'
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, tomorrow)) return '내일'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(date, yesterday)) return '어제'
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
    <div>
      <h3 className="text-sm font-semibold text-foreground-soft mb-2">처리할 납입</h3>
      {upcomingEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">처리할 납입이 없어요</p>
      ) : (
        <div>
          {groups.map(({ date, events }) => {
            const isOverdue = date < today
            return (
              <section key={date.toISOString()} className="mb-3 last:mb-0">
                <h4 className="sticky top-0 z-10 -mx-4 px-4 bg-card py-3 text-xs font-medium text-foreground-subtle">
                  {formatRelativeDate(date, today)}
                  {isOverdue && <span className="ml-1.5">· 미완료</span>}
                </h4>
                {events.map((e, idx) => (
                  <PaymentEventRow
                    key={`${e.year}-${e.month}-${e.day}-${e.investmentId}`}
                    event={e}
                    investment={investmentMap.get(e.investmentId)}
                    isCompleted={false}
                    onClick={() => goToDetail(e.investmentId)}
                    onComplete={() => handleComplete(e)}
                    showDivider={idx !== events.length - 1}
                  />
                ))}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
