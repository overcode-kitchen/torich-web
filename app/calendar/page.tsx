'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// 기존 훅 재사용
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'

// 새로 만든 훅
import { useCalendar } from '@/app/hooks/calendar/useCalendar'
import { usePaymentCompletion } from '@/app/hooks/payment/usePaymentCompletion'
import { useCalendarEvents } from '@/app/hooks/calendar/useCalendarEvents'

// View 컴포넌트
import CalendarView from '@/app/components/CalendarView'
import { isRetroactiveMonth } from '@/app/utils/payment-history'
import type { PaymentEvent } from '@/app/utils/stats'

export default function CalendarPage() {
  const router = useRouter()

  // 기존 훅 재사용
  const { user, isLoading: authLoading } = useAuth()
  const { records, isLoading: recordsLoading } = useInvestmentsContext()

  // 캘린더 훅
  const {
    currentMonth,
    calendarDays,
    selectedDate,
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
    year,
    month,
  } = useCalendar()

  // 납입 완료/미룸 훅
  const {
    isEventAutoCompleted,
    isEventRetroactivelyCompleted,
    isEventPostponed,
    handleComplete,
    handleUncomplete,
    handlePostpone,
    handleUnpostpone,
  } = usePaymentCompletion()

  // 완료 판정은 구간에 따라 볼 맵이 다르다. 상세 납입 기록 표와 같은 규칙을 쓴다
  // (소급 구간 = 소급 맵만). 두 맵을 OR하면 소급 구간에 잘못 남은 자동 기록까지
  // 완료로 쳐서, 상세는 "미기록"인데 캘린더만 "완료"로 보인다.
  const recordById = useMemo(() => new Map(records.map((r) => [r.id, r])), [records])

  const isEventCompleted = useCallback(
    (e: PaymentEvent) => {
      const inv = recordById.get(e.investmentId)
      const isRetroactive = inv
        ? isRetroactiveMonth(e.year, e.month, inv.start_date ?? inv.created_at, inv.created_at)
        : false
      return isRetroactive ? isEventRetroactivelyCompleted(e) : isEventAutoCompleted(e)
    },
    [recordById, isEventAutoCompleted, isEventRetroactivelyCompleted]
  )

  // 캘린더 이벤트 훅 — 월 전체 이벤트와 일자별 상태
  const {
    eventsForMonth,
    getDayStatus,
  } = useCalendarEvents({
    records,
    year,
    month,
    isEventCompleted,
    isEventPostponed,
  })

  const isLoading = authLoading || recordsLoading

  if (!isLoading && !user) {
    router.replace('/login')
    return null
  }

  return (
    <CalendarView
      isLoading={isLoading}
      currentMonth={currentMonth}
      year={year}
      month={month}
      calendarDays={calendarDays}
      selectedDate={selectedDate}
      slideDirection={slideDirection}
      isPickerOpen={isPickerOpen}
      goToPrevMonth={goToPrevMonth}
      goToNextMonth={goToNextMonth}
      goToMonth={goToMonth}
      goToToday={goToToday}
      isTodaySelected={isTodaySelected}
      openPicker={openPicker}
      closePicker={closePicker}
      selectDate={selectDate}
      clearSelection={clearSelection}
      scrollTick={scrollTick}
      getDayStatus={getDayStatus}
      eventsForMonth={eventsForMonth}
      records={records}
      isEventCompleted={isEventCompleted}
      isEventPostponed={isEventPostponed}
      handleComplete={handleComplete}
      handleUncomplete={handleUncomplete}
      handlePostpone={handlePostpone}
      handleUnpostpone={handleUnpostpone}
    />
  )
}
