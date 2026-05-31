'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { PaymentEvent } from '@/app/utils/stats'
import type { Investment } from '@/app/types/investment'
import { buildMonthDayGroups, formatGroupLabel } from '@/app/utils/calendar-agenda'
import { PaymentEventRow } from './PaymentEventRow'

// programmatic smooth scroll 도중 발생하는 scroll 이벤트로 인해 그리드 selection이 깜빡이지 않도록 락을 건다.
const PROGRAMMATIC_SCROLL_LOCK_MS = 800

interface MonthAgendaSectionProps {
  year: number
  month: number
  eventsForMonth: PaymentEvent[]
  records: Investment[]
  selectedDate: Date | null
  scrollTick: number
  onVisibleDayChange: (date: Date | null) => void
  isEventCompleted: (event: PaymentEvent) => boolean
  handleComplete: (event: PaymentEvent) => void
}

export function MonthAgendaSection({
  year,
  month,
  eventsForMonth,
  records,
  selectedDate,
  scrollTick,
  onVisibleDayChange,
  isEventCompleted,
  handleComplete,
}: MonthAgendaSectionProps) {
  const router = useRouter()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const investmentMap = useMemo(() => {
    const map = new Map<string, Investment>()
    for (const r of records) map.set(r.id, r)
    return map
  }, [records])

  // 한 달 1일~말일까지 모든 날짜 그룹. 빈 날짜는 events.length === 0 으로 들어와 헤더 한 줄로 컴팩트 표기된다.
  const dayGroups = useMemo(
    () => buildMonthDayGroups(eventsForMonth, year, month),
    [eventsForMonth, year, month]
  )

  // 선택된 날짜가 현재 보이는 월에 속할 때만 highlight 대상으로 삼는다. 모든 날짜가 리스트에 존재하므로 보정 없이 그대로 사용 가능.
  const selectedDayKey =
    selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month - 1
      ? selectedDate.getDate()
      : null

  const groupRefs = useRef<Map<number, HTMLElement>>(new Map())
  const rootRef = useRef<HTMLDivElement>(null)
  // 사용자 탭/월 이동으로 시작된 smooth scroll 동안의 사용자 측 scroll-sync 무시용 락
  const programmaticUntilRef = useRef(0)
  // 같은 day가 중복 통보되는 걸 막기 위한 직전 값
  const lastReportedDayRef = useRef<number | null>(null)
  // ref로 최신 selectedDate를 effect에 노출 — selectedDate 변경 단독으론 스크롤 트리거하지 않음
  const selectedDateRef = useRef(selectedDate)
  selectedDateRef.current = selectedDate

  // 월/연 변경 시 직전 보고값 초기화 (월 간 비교 의미 없음)
  useEffect(() => {
    lastReportedDayRef.current = null
  }, [year, month])

  // scrollTick이 바뀔 때 리스트를 selectedDate 자리로 smooth scroll.
  useEffect(() => {
    programmaticUntilRef.current = Date.now() + PROGRAMMATIC_SCROLL_LOCK_MS
    const d = selectedDateRef.current
    const scroller = rootRef.current?.closest('[data-calendar-scroll]')
    if (!(scroller instanceof HTMLElement)) return
    if (!d) {
      scroller.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (d.getFullYear() !== year || d.getMonth() !== month - 1) return
    const el = groupRefs.current.get(d.getDate())
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [scrollTick, dayGroups, year, month])

  // 리스트 스크롤 → 최상단에 노출된 그룹으로 selectedDate 동기화 (그리드 highlight)
  useEffect(() => {
    const scroller = rootRef.current?.closest('[data-calendar-scroll]')
    if (!(scroller instanceof HTMLElement)) return
    if (dayGroups.length === 0) return
    let rafId: number | null = null
    const onScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (Date.now() < programmaticUntilRef.current) return
        const scrollerRect = scroller.getBoundingClientRect()
        let activeDay: number | null = null
        for (const g of dayGroups) {
          const el = groupRefs.current.get(g.dayKey)
          if (!el) continue
          const topRelative = el.getBoundingClientRect().top - scrollerRect.top
          // 그룹 상단이 컨테이너 상단을 통과한 마지막 그룹이 곧 sticky pinned 그룹
          if (topRelative <= 1) activeDay = g.dayKey
          else break
        }
        if (activeDay === lastReportedDayRef.current) return
        lastReportedDayRef.current = activeDay
        onVisibleDayChange(activeDay !== null ? new Date(year, month - 1, activeDay) : null)
      })
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [dayGroups, year, month, onVisibleDayChange])

  const goToDetail = (investmentId: string) => {
    router.push(`/investment?id=${investmentId}`)
  }

  return (
    <div ref={rootRef}>
      {dayGroups.map(({ date, dayKey, events }) => {
        const isEmpty = events.length === 0
        const isOverdue = !isEmpty && date < today
        const allCompleted = !isEmpty && events.every((e) => isEventCompleted(e))
        const pendingCount = events.filter((e) => !isEventCompleted(e)).length
        const isSelected = dayKey === selectedDayKey
        return (
          <section
            key={dayKey}
            ref={(el) => {
              if (el) groupRefs.current.set(dayKey, el)
              else groupRefs.current.delete(dayKey)
            }}
            className="mb-3 last:mb-0 scroll-mt-0"
          >
            <h4
              className={`sticky top-0 z-10 -mx-4 px-4 bg-card py-3 text-xs transition-colors ${
                isSelected ? 'font-semibold text-brand-600' : 'font-medium text-foreground-subtle'
              }`}
            >
              {formatGroupLabel(date, today)}
              {isEmpty && <span className="ml-1.5 text-foreground-subtle">· 예정 없음</span>}
              {!isEmpty && isOverdue && !allCompleted && (
                <span className="ml-1.5 text-red-500">· 미완료 {pendingCount}</span>
              )}
            </h4>
            {!isEmpty &&
              events.map((e, idx) => (
                <PaymentEventRow
                  key={`${e.year}-${e.month}-${e.day}-${e.investmentId}`}
                  event={e}
                  investment={investmentMap.get(e.investmentId)}
                  isCompleted={isEventCompleted(e)}
                  onClick={() => goToDetail(e.investmentId)}
                  onComplete={() => handleComplete(e)}
                  showDivider={idx !== events.length - 1}
                />
              ))}
          </section>
        )
      })}
    </div>
  )
}
