'use client'

import { useRouter } from 'next/navigation'

// 기존 훅 재사용
import { useAuth } from '@/app/hooks/useAuth'
import { useInvestments } from '@/app/hooks/useInvestments'

// 새로 만든 훅
import { useCalendar } from '@/app/hooks/useCalendar'
import { usePaymentCompletion } from '@/app/hooks/usePaymentCompletion'
import { useCalendarEvents } from '@/app/hooks/useCalendarEvents'

// View 컴포넌트
import CalendarView from '@/app/components/CalendarView'

export default function CalendarPage() {
  const router = useRouter()

  // 기존 훅 재사용
  const { user, isLoading: authLoading } = useAuth()
  const { records, isLoading: recordsLoading } = useInvestments(user?.id)

  // 캘린더 훅
  const {
    currentMonth,
    calendarDays,
    selectedDate,
    goToPrevMonth,
    goToNextMonth,
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
      goToPrevMonth={goToPrevMonth}
      goToNextMonth={goToNextMonth}
      selectDate={selectDate}
      clearSelection={clearSelection}
      getDayStatus={getDayStatus}
      selectedEvents={selectedEvents}
      isEventCompleted={isEventCompleted}
      handleComplete={handleComplete}
      pendingUndo={!!pendingUndo}
      handleUndo={handleUndo}
    />
  )
}
