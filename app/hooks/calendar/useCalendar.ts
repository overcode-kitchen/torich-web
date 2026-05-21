'use client'

import { useState, useMemo, useCallback } from 'react'
import { addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { track } from '@/app/lib/analytics'

/** 월 전환 슬라이드 애니메이션 방향 */
export type CalendarSlideDirection = 'next' | 'prev'

export function useCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  // null: 최초 로드 시점 — 애니메이션 없음
  const [slideDirection, setSlideDirection] = useState<CalendarSlideDirection | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

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
  }, [])

  const goToNextMonth = useCallback(() => {
    setSlideDirection('next')
    setCurrentMonth((m) => addMonths(m, 1))
    setSelectedDate(null)
  }, [])

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
    },
    [currentMonth],
  )

  const selectDate = useCallback((day: number) => {
    track('calendar_date_select')
    setSelectedDate(new Date(year, month - 1, day))
  }, [year, month])

  const clearSelection = useCallback(() => {
    setSelectedDate(null)
  }, [])

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
    openPicker,
    closePicker,
    selectDate,
    clearSelection,
  }
}
