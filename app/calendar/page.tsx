'use client'

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

  // 납입 완료 훅
  const {
    isEventCompleted,
    handleComplete,
    handleUndo,
    pendingUndo,
  } = usePaymentCompletion()

  // 캘린더 이벤트 훅 — 월 전체 이벤트와 일자별 상태
  const {
    eventsForMonth,
    getDayStatus,
  } = useCalendarEvents({
    records,
    year,
    month,
    isEventCompleted,
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
      handleComplete={handleComplete}
      pendingUndo={!!pendingUndo}
      handleUndo={handleUndo}
    />
  )
}
