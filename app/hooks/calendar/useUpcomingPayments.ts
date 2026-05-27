import { useMemo } from 'react'
import { Investment, getStartDate } from '@/app/types/investment'
import { isCompleted } from '@/app/utils/date'
import {
  getPaymentEventsForMonth,
  type PaymentEvent,
} from '@/app/utils/stats'

const UPCOMING_WINDOW_DAYS = 60
const UPCOMING_MAX_ITEMS = 10

interface UseUpcomingPaymentsProps {
  records: Investment[]
  isEventCompleted: (event: PaymentEvent) => boolean
}

export function useUpcomingPayments({
  records,
  isEventCompleted,
}: UseUpcomingPaymentsProps) {
  const activeRecords = useMemo(() => {
    return records.filter((r) => {
      const start = getStartDate(r)
      return !isCompleted(start, r.period_years)
    })
  }, [records])

  const upcomingEvents = useMemo<PaymentEvent[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const windowEnd = new Date(today)
    windowEnd.setDate(windowEnd.getDate() + UPCOMING_WINDOW_DAYS)

    const months: Array<{ year: number; month: number }> = []
    const cursor = new Date(today.getFullYear(), today.getMonth(), 1)
    while (cursor <= windowEnd) {
      months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    const all: PaymentEvent[] = []
    for (const { year, month } of months) {
      all.push(...getPaymentEventsForMonth(activeRecords, year, month))
    }

    return all
      .filter((e) => {
        const eventDate = new Date(e.year, e.month - 1, e.day)
        if (eventDate < today) return false
        if (eventDate > windowEnd) return false
        return !isEventCompleted(e)
      })
      .sort((a, b) => {
        const da = new Date(a.year, a.month - 1, a.day).getTime()
        const db = new Date(b.year, b.month - 1, b.day).getTime()
        return da - db
      })
      .slice(0, UPCOMING_MAX_ITEMS)
  }, [activeRecords, isEventCompleted])

  return { upcomingEvents }
}
