'use client'

import { useRouter } from 'next/navigation'
import { CircleNotch } from '@phosphor-icons/react'

// 기존 훅 재사용
import { useAuth } from '@/app/hooks/useAuth'
import { useInvestments } from '@/app/hooks/useInvestments'

// 새로 만든 훅
import { useCalendar } from '@/app/hooks/useCalendar'
import { usePaymentCompletion } from '@/app/hooks/usePaymentCompletion'
import { useCalendarEvents } from '@/app/hooks/useCalendarEvents'

// 컴포넌트
import { CalendarGridSection } from '@/app/components/CalendarSections/CalendarGridSection'
import { SelectedDateSection } from '@/app/components/CalendarSections/SelectedDateSection'
import { UndoToastSection } from '@/app/components/CalendarSections/UndoToastSection'

export default function CalendarPage() {
  const router = useRouter()
  
  // 기존 훅 재사용
  const { user, isLoading: authLoading } = useAuth()
  const { records, isLoading: recordsLoading } = useInvestments(user?.id)
  
  // 캘린더 훅
  const {
    currentMonth,
    year,
    month,
    selectedDate,
    calendarDays,
    goToPrevMonth,
    goToNextMonth,
    selectDate,
    clearSelection,
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
    activeRecords,
    eventsForMonth,
    eventsByDay,
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  return (
    <main
      className="min-h-screen bg-surface"
      onClick={clearSelection}
      role="presentation"
    >
      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-4">캘린더</h1>

        <CalendarGridSection
          currentMonth={currentMonth}
          calendarDays={calendarDays}
          selectedDate={selectedDate}
          getDayStatus={getDayStatus}
          goToPrevMonth={goToPrevMonth}
          goToNextMonth={goToNextMonth}
          selectDate={selectDate}
          clearSelection={clearSelection}
        />

        <SelectedDateSection
          selectedDate={selectedDate}
          selectedEvents={selectedEvents}
          isEventCompleted={isEventCompleted}
          handleComplete={handleComplete}
        />
      </div>

      <UndoToastSection
        pendingUndo={!!pendingUndo}
        handleUndo={handleUndo}
      />
    </main>
  )
}
