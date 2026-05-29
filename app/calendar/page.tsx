'use client'

import { useRouter } from 'next/navigation'

// 기존 훅 재사용
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'

// 새로 만든 훅
import { useCalendar } from '@/app/hooks/calendar/useCalendar'
import { usePaymentCompletion } from '@/app/hooks/payment/usePaymentCompletion'
import { useCalendarEvents } from '@/app/hooks/calendar/useCalendarEvents'
import { useUpcomingPayments } from '@/app/hooks/calendar/useUpcomingPayments'

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
    isCurrentMonth,
    openPicker,
    closePicker,
    selectDate,
    clearSelection,
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

  // 캘린더 이벤트 훅
  const {
    selectedEvents,
    getDayStatus,
  } = useCalendarEvents({
    records,
    year,
    month,
    selectedDate,
    isEventCompleted,
  })

  // 다가오는 납입 (날짜 미선택 상태에서 노출)
  const { upcomingEvents } = useUpcomingPayments({
    records,
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
      calendarDays={calendarDays}
      selectedDate={selectedDate}
      slideDirection={slideDirection}
      isPickerOpen={isPickerOpen}
      goToPrevMonth={goToPrevMonth}
      goToNextMonth={goToNextMonth}
      goToMonth={goToMonth}
      goToToday={goToToday}
      isCurrentMonth={isCurrentMonth}
      openPicker={openPicker}
      closePicker={closePicker}
      selectDate={selectDate}
      clearSelection={clearSelection}
      getDayStatus={getDayStatus}
      selectedEvents={selectedEvents}
      upcomingEvents={upcomingEvents}
      records={records}
      isEventCompleted={isEventCompleted}
      handleComplete={handleComplete}
      pendingUndo={!!pendingUndo}
      handleUndo={handleUndo}
    />
  )
}
