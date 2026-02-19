import { useMemo } from 'react'
import { Investment, getStartDate } from '@/app/types/investment'
import { isCompleted } from '@/app/utils/date'
import {
  getPaymentEventsForMonth,
  type PaymentEvent,
} from '@/app/utils/stats'

interface UseCalendarEventsProps {
  records: Investment[]
  year: number
  month: number
  selectedDate: Date | null
  isEventCompleted: (event: PaymentEvent) => boolean
}

export function useCalendarEvents({
  records,
  year,
  month,
  selectedDate,
  isEventCompleted,
}: UseCalendarEventsProps) {
  // 활성 투자 필터링 (정렬 포함)
  const activeRecords = useMemo(() => {
    return records
      .filter((r) => {
        const start = getStartDate(r)
        return !isCompleted(start, r.period_years)
      })
      .sort((a, b) => {
        // created_at 내림차순 정렬
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
  }, [records])

  // 월별 이벤트 계산
  const eventsForMonth = useMemo(
    () => getPaymentEventsForMonth(activeRecords, year, month),
    [activeRecords, year, month]
  )

  // 일별 이벤트 맵
  const eventsByDay = useMemo(() => {
    const map = new Map<number, PaymentEvent[]>()
    for (const e of eventsForMonth) {
      const list = map.get(e.day) || []
      list.push(e)
      map.set(e.day, list)
    }
    return map
  }, [eventsForMonth])

  // 선택된 날짜의 이벤트
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    if (selectedDate.getFullYear() !== year || selectedDate.getMonth() !== month - 1) return []
    const d = selectedDate.getDate()
    return eventsByDay.get(d) || []
  }, [selectedDate, eventsByDay, year, month])

  // 날짜 상태 계산
  const getDayStatus = (day: number): 'completed' | 'missed' | 'scheduled' | null => {
    const events = eventsByDay.get(day) || []
    if (events.length === 0) return null
    const today = new Date()
    const isPast = year < today.getFullYear() || 
      (year === today.getFullYear() && month < today.getMonth() + 1) || 
      (year === today.getFullYear() && month === today.getMonth() + 1 && day < today.getDate())
    const allCompleted = events.every((ev) => isEventCompleted(ev))
    if (allCompleted) return 'completed'
    if (isPast) return 'missed'
    return 'scheduled'
  }

  return {
    activeRecords,
    eventsForMonth,
    eventsByDay,
    selectedEvents,
    getDayStatus,
  }
}
