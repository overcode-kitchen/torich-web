'use client'

import { useState, useMemo, useCallback } from 'react'
import { addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from 'date-fns'

export function useCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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
    setCurrentMonth((m) => subMonths(m, 1))
    setSelectedDate(null)
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => addMonths(m, 1))
    setSelectedDate(null)
  }, [])

  const selectDate = useCallback((day: number) => {
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
    goToPrevMonth,
    goToNextMonth,
    selectDate,
    clearSelection,
  }
}
