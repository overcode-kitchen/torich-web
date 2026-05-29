import { format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { PaymentEvent } from '@/app/utils/stats'

export interface DateGroup {
  date: Date
  dayKey: number
  events: PaymentEvent[]
}

export function groupByDay(events: PaymentEvent[]): DateGroup[] {
  const map = new Map<number, DateGroup>()
  for (const e of events) {
    const existing = map.get(e.day)
    if (existing) {
      existing.events.push(e)
    } else {
      map.set(e.day, {
        date: new Date(e.year, e.month - 1, e.day),
        dayKey: e.day,
        events: [e],
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.dayKey - b.dayKey)
}

export function formatGroupLabel(date: Date, today: Date): string {
  if (isSameDay(date, today)) return `오늘 · ${format(date, 'M월 d일 (E)', { locale: ko })}`
  return format(date, 'M월 d일 (E)', { locale: ko })
}

// 탭한 날짜에 이벤트가 없을 때 가장 가까운(다음 우선, 없으면 이전) 그룹 day 반환
export function findNearestDayKey(groups: DateGroup[], targetDay: number): number | null {
  if (groups.length === 0) return null
  let next: DateGroup | null = null
  let prev: DateGroup | null = null
  for (const g of groups) {
    if (g.dayKey === targetDay) return g.dayKey
    if (g.dayKey > targetDay && (next === null || g.dayKey < next.dayKey)) next = g
    if (g.dayKey < targetDay && (prev === null || g.dayKey > prev.dayKey)) prev = g
  }
  return (next ?? prev)?.dayKey ?? null
}
