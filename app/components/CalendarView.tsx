'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { CalendarHeaderSection } from '@/app/components/CalendarSections/CalendarHeaderSection'
import { CalendarGridSection } from '@/app/components/CalendarSections/CalendarGridSection'
import MonthPickerSheet from '@/app/components/CalendarSections/MonthPickerSheet'
import { SelectedDateSection } from '@/app/components/CalendarSections/SelectedDateSection'
import { UpcomingEventsSection } from '@/app/components/CalendarSections/UpcomingEventsSection'
import { UndoToastSection } from '@/app/components/CalendarSections/UndoToastSection'
import type { PaymentEvent } from '@/app/utils/stats'
import type { CalendarSlideDirection } from '@/app/hooks/calendar/useCalendar'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import { useSwipe } from '@/app/hooks/useSwipe'
import { useCalendarCollapse } from '@/app/hooks/calendar/useCalendarCollapse'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'

interface CalendarViewProps {
    isLoading: boolean

    // Calendar State
    currentMonth: Date
    calendarDays: (number | null)[]
    selectedDate: Date | null
    slideDirection: CalendarSlideDirection | null
    isPickerOpen: boolean

    // Calendar Actions
    goToPrevMonth: () => void
    goToNextMonth: () => void
    goToMonth: (year: number, month: number) => void
    openPicker: () => void
    closePicker: () => void
    selectDate: (day: number) => void
    clearSelection: () => void

    // Event Status
    getDayStatus: (day: number) => 'completed' | 'missed' | 'scheduled' | null

    // Selected Date Events
    selectedEvents: PaymentEvent[]

    // Upcoming events (when no date is selected)
    upcomingEvents: PaymentEvent[]

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
    slideDirection,
    isPickerOpen,
    goToPrevMonth,
    goToNextMonth,
    goToMonth,
    openPicker,
    closePicker,
    selectDate,
    clearSelection,
    getDayStatus,
    selectedEvents,
    upcomingEvents,
    isEventCompleted,
    handleComplete,
    pendingUndo,
    handleUndo,
}: CalendarViewProps) {
    const isNativeApp = useIsNativeApp()

    // 캘린더 그리드 좌우 스와이프로 월 이동 (헤더 캐럿은 보조 컨트롤)
    const swipeHandlers = useSwipe({
        onSwipeLeft: goToNextMonth,
        onSwipeRight: goToPrevMonth,
    })

    // 리스트 스크롤 시 캘린더를 주 보기로 접고, 최상단 복귀 시 월 보기로 복원
    const { isCollapsed, onListScroll } = useCalendarCollapse()

    const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
    const contentPaddingTop = isNativeApp
        ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px)'
        : '48px'
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
                paddingTop: contentPaddingTop,
                paddingBottom: APP_TAB_CONTENT_PADDING_BOTTOM,
            }}
        >
            {/* 앱바: 상단 고정 (홈/통계 등과 동일) */}
            <CalendarHeaderSection
                currentMonth={currentMonth}
                headerSafeTop={headerSafeTop}
                goToPrevMonth={goToPrevMonth}
                goToNextMonth={goToNextMonth}
                openPicker={openPicker}
            />

            {/* 캘린더 그리드: 고정, 예정 투자 영역만 카드 많을 때 스크롤 */}
            <div className="flex-1 min-h-0 flex flex-col max-w-md md:max-w-lg lg:max-w-2xl mx-auto w-full px-4 overflow-hidden">
                <div className="flex-shrink-0 pt-2">
                    <CalendarGridSection
                        currentMonth={currentMonth}
                        calendarDays={calendarDays}
                        selectedDate={selectedDate}
                        slideDirection={slideDirection}
                        getDayStatus={getDayStatus}
                        selectDate={selectDate}
                        clearSelection={clearSelection}
                        swipeHandlers={swipeHandlers}
                        isCollapsed={isCollapsed}
                    />
                </div>

                <div
                    className="flex-1 min-h-0 overflow-y-auto"
                    onScroll={onListScroll}
                >
                    {selectedDate ? (
                        <SelectedDateSection
                            selectedDate={selectedDate}
                            selectedEvents={selectedEvents}
                            isEventCompleted={isEventCompleted}
                            handleComplete={handleComplete}
                        />
                    ) : (
                        <UpcomingEventsSection
                            upcomingEvents={upcomingEvents}
                            handleComplete={handleComplete}
                        />
                    )}
                </div>
            </div>

            <UndoToastSection
                pendingUndo={pendingUndo}
                handleUndo={handleUndo}
            />

            {isPickerOpen && (
                <MonthPickerSheet
                    currentMonth={currentMonth}
                    onSelect={goToMonth}
                    onClose={closePicker}
                />
            )}
        </main>
    )
}
