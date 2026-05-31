import { format, isSameDay, getDaysInMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { PaymentEvent } from '@/app/utils/stats'

export interface DateGroup {
  date: Date
  dayKey: number
  events: PaymentEvent[]
}

// 한 달의 1일부터 말일까지 모든 날짜 그룹을 생성한다. 이벤트가 없는 날은 events 길이가 0인 빈 그룹으로 들어가므로,
// 렌더 단계에서 events.length === 0 분기로 "예정 없음" 컴팩트 표기를 노출하면 된다.
// 사용자가 어떤 날을 선택하든 그 자리에 항상 섹션이 존재하므로 nearest 폴백/placeholder 끼워넣기 같은 추가 보정이 필요 없다.
export function buildMonthDayGroups(
  events: PaymentEvent[],
  year: number,
  month: number
): DateGroup[] {
  const eventsByDay = new Map<number, PaymentEvent[]>()
  for (const e of events) {
    const bucket = eventsByDay.get(e.day)
    if (bucket) bucket.push(e)
    else eventsByDay.set(e.day, [e])
  }
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1))
  const groups: DateGroup[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    groups.push({
      date: new Date(year, month - 1, d),
      dayKey: d,
      events: eventsByDay.get(d) ?? [],
    })
  }
  return groups
}

export function formatGroupLabel(date: Date, today: Date): string {
  if (isSameDay(date, today)) return `오늘 · ${format(date, 'M월 d일 (E)', { locale: ko })}`
  return format(date, 'M월 d일 (E)', { locale: ko })
}
