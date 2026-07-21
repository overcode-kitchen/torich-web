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
  // 리스트 스크롤이 거꾸로 selectedDate를 갱신할 땐 tick 증가시키지 않아 feedback loop를 방지.
  const [scrollTick, setScrollTick] = useState(0)
  const bumpTick = useCallback(() => setScrollTick((t) => t + 1), [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  // 자정 경과 후에도 "오늘"이 그날의 실제 today를 가리키도록 매 렌더 평가
  const now = new Date()
  // '오늘' 단축은 오늘 날짜가 선택돼 있지 않을 때만 노출 — 다른 달뿐 아니라
  // 같은 달의 다른 날을 탭한 경우에도 "오늘로 돌아가기"가 가능해야 워딩과 맞음
  const isTodaySelected =
    selectedDate !== null &&
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate()

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
    const isSameAsCurrent =
      selectedDate !== null &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month - 1 &&
      selectedDate.getDate() === day
    if (isSameAsCurrent) {
      // 같은 날 재탭 → 선택 해제. 사용자가 보고 있는 스크롤 위치는 그대로 유지(bumpTick 생략).
      track('calendar_date_deselect')
      setSelectedDate(null)
      return
    }
    track('calendar_date_select')
    setSelectedDate(new Date(year, month - 1, day))
    bumpTick()
  }, [year, month, selectedDate, bumpTick])

  // 외부 영역 탭/빈 셀 등으로 선택만 해제. 리스트는 사용자가 보고 있던 위치를 유지하므로 bumpTick을 호출하지 않는다.
  const clearSelection = useCallback(() => {
    setSelectedDate(null)
  }, [])

  // '오늘' 단축: 이번 달로 이동할 뿐 아니라 오늘 날짜를 실제로 선택하고
  // 리스트를 오늘 항목으로 스크롤한다(bumpTick) — 워딩 "오늘"과 동작을 일치시킴
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
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
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
    isTodaySelected,
    openPicker,
    closePicker,
    selectDate,
    clearSelection,
    scrollTick,
  }
}
