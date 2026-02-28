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
            className="fixed inset-0 flex flex-col bg-surface overflow-hidden"
            onClick={clearSelection}
            role="presentation"
            style={{
                paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {/* 앱바: 상단 고정 (홈/통계 등과 동일) */}
            <header
                className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)',
                }}
            >
                <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4">
                    <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
                        <h1 className="text-xl font-bold text-foreground">캘린더</h1>
                    </div>
                </div>
            </header>

            {/* 캘린더 그리드: 고정, 예정 투자 영역만 카드 많을 때 스크롤 */}
            <div className="flex-1 min-h-0 flex flex-col max-w-md md:max-w-lg lg:max-w-2xl mx-auto w-full px-4 overflow-hidden">
                <div className="flex-shrink-0 pt-2">
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
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pb-24">
                    <SelectedDateSection
                        selectedDate={selectedDate}
                        selectedEvents={selectedEvents}
                        isEventCompleted={isEventCompleted}
                        handleComplete={handleComplete}
                    />
                </div>
            </div>

            <UndoToastSection
                pendingUndo={pendingUndo}
                handleUndo={handleUndo}
            />
        </main>
    )
}
