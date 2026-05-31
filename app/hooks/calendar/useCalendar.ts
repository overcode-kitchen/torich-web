'use client'

import { useState, useMemo, useCallback } from 'react'
import { addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { track } from '@/app/lib/analytics'

/** 월 전환 슬라이드 애니메이션 방향 */
export type CalendarSlideDirection = 'next' | 'prev'

export function useCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  // 진입 직후엔 오늘로 스크롤되도록 today를 기본 anchor로 설정
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())
  // null: 최초 로드 시점 — 애니메이션 없음
  const [slideDirection, setSlideDirection] = useState<CalendarSlideDirection | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  // 리스트 스크롤 의도 트리거. 사용자 탭/월 이동 시 증가 → 리스트가 anchor로 smooth scroll.
  const [scrollTick, setScrollTick] = useState(0)
  const bumpTick = useCallback(() => setScrollTick((t) => t + 1), [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  // 자정 경과 후에도 "오늘"이 그날의 실제 today를 가리키도록 매 렌더 평가
  const now = new Date()
  const isCurrentMonth =
    currentMonth.getFullYear() === now.getFullYear() &&
    currentMonth.getMonth() === now.getMonth()

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const first = startOfMonth(currentMonth)
    const startPad = getDay(first)
    const cells: (number | null)[] = []
    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [currentMonth])

  const goToPrevMonth = useCallback(() => {
    setSlideDirection('prev')
    setCurrentMonth((m) => subMonths(m, 1))
    setSelectedDate(null)
    bumpTick()
  }, [bumpTick])

  const goToNextMonth = useCallback(() => {
    setSlideDirection('next')
    setCurrentMonth((m) => addMonths(m, 1))
    setSelectedDate(null)
    bumpTick()
  }, [bumpTick])

  const openPicker = useCallback(() => setIsPickerOpen(true), [])
  const closePicker = useCallback(() => setIsPickerOpen(false), [])

  // 연도·월 피커에서 특정 월로 한 번에 이동 (targetMonth: 1-12)
  // 피커 닫기는 시트의 퇴장 애니메이션 이후 closePicker가 담당한다
  const goToMonth = useCallback(
    (targetYear: number, targetMonth: number) => {
      const targetIndex = targetYear * 12 + (targetMonth - 1)
      const currentIndex = currentMonth.getFullYear() * 12 + currentMonth.getMonth()
      setSlideDirection(targetIndex < currentIndex ? 'prev' : 'next')
      setCurrentMonth(new Date(targetYear, targetMonth - 1, 1))
      setSelectedDate(null)
      bumpTick()
    },
    [currentMonth, bumpTick],
  )

  const selectDate = useCallback((day: number) => {
    setSelectedDate((prev) => {
      // 같은 날 재탭 → anchor 해제. 리스트는 월 전체 top으로 복귀
      if (
        prev &&
        prev.getFullYear() === year &&
        prev.getMonth() === month - 1 &&
        prev.getDate() === day
      ) {
        track('calendar_date_deselect')
        return null
      }
      track('calendar_date_select')
      return new Date(year, month - 1, day)
    })
    bumpTick()
  }, [year, month, bumpTick])

  const clearSelection = useCallback(() => {
    setSelectedDate(null)
    bumpTick()
  }, [bumpTick])

  const goToToday = useCallback(() => {
    track('calendar_go_today')
    const today = new Date()
    setCurrentMonth((prev) => {
      const prevIndex = prev.getFullYear() * 12 + prev.getMonth()
      const nextIndex = today.getFullYear() * 12 + today.getMonth()
      if (prevIndex === nextIndex) return prev
      setSlideDirection(nextIndex < prevIndex ? 'prev' : 'next')
      return new Date(today.getFullYear(), today.getMonth(), 1)
    })
    setSelectedDate(null)
    bumpTick()
  }, [bumpTick])

  return {
    currentMonth,
    year,
    month,
    selectedDate,
    calendarDays,
    slideDirection,
    isPickerOpen,
    goToPrevMonth,
    goToNextMonth,
    goToMonth,
    goToToday,
    isCurrentMonth,
    openPicker,
    closePicker,
    selectDate,
    clearSelection,
    scrollTick,
  }
}
