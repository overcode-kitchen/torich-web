'use client'

import { useCallback, useState } from 'react'
import type { CalendarSlideDirection } from '@/app/hooks/calendar/useCalendar'

/** 연도·월 피커의 연도 스테퍼 상태를 관리한다. */
export function useMonthPicker(initialYear: number) {
  const [viewYear, setViewYear] = useState(initialYear)
  // null: 최초 표시 시점 — 애니메이션 없음
  const [slideDirection, setSlideDirection] = useState<CalendarSlideDirection | null>(null)

  const goPrevYear = useCallback(() => {
    setSlideDirection('prev')
    setViewYear((y) => y - 1)
  }, [])

  const goNextYear = useCallback(() => {
    setSlideDirection('next')
    setViewYear((y) => y + 1)
  }, [])

  return { viewYear, slideDirection, goPrevYear, goNextYear }
}
