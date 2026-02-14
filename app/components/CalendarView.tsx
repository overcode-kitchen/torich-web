'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { CalendarGridSection } from '@/app/components/CalendarSections/CalendarGridSection'
import { SelectedDateSection } from '@/app/components/CalendarSections/SelectedDateSection'
import { UndoToastSection } from '@/app/components/CalendarSections/UndoToastSection'
import type { PaymentEvent } from '@/app/utils/stats'

interface CalendarViewProps {
    isLoading: boolean

    // Calendar State
    currentMonth: Date
    calendarDays: (number | null)[]
    selectedDate: Date | null

    // Calendar Actions
    goToPrevMonth: () => void
    goToNextMonth: () => void
    selectDate: (day: number) => void
    clearSelection: () => void

    // Event Status
    getDayStatus: (day: number) => 'completed' | 'missed' | 'scheduled' | null

    // Selected Date Events
    selectedEvents: PaymentEvent[]

    // Payment Actions
    isEventCompleted: (e: PaymentEvent) => boolean
    handleComplete: (e: PaymentEvent) => void

    // Undo
    pendingUndo: boolean
    handleUndo: () => void
}

export default function CalendarView({
    isLoading,
    currentMonth,
    calendarDays,
    selectedDate,
    goToPrevMonth,
    goToNextMonth,
    selectDate,
    clearSelection,
    getDayStatus,
    selectedEvents,
    isEventCompleted,
    handleComplete,
    pendingUndo,
    handleUndo,
}: CalendarViewProps) {
    if (isLoading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
            </main>
        )
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
                pendingUndo={pendingUndo}
                handleUndo={handleUndo}
            />
        </main>
    )
}
