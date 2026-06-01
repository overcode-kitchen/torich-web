'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { CalendarHeaderSection } from '@/app/components/CalendarSections/CalendarHeaderSection'
import { CalendarGridSection } from '@/app/components/CalendarSections/CalendarGridSection'
import MonthPickerSheet from '@/app/components/CalendarSections/MonthPickerSheet'
import { MonthAgendaSection } from '@/app/components/CalendarSections/MonthAgendaSection'
import { UndoToastSection } from '@/app/components/CalendarSections/UndoToastSection'
import type { PaymentEvent } from '@/app/utils/stats'
import type { Investment } from '@/app/types/investment'
import type { CalendarSlideDirection } from '@/app/hooks/calendar/useCalendar'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import { useSwipe } from '@/app/hooks/useSwipe'
import { useCalendarCollapse } from '@/app/hooks/calendar/useCalendarCollapse'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'

interface CalendarViewProps {
    isLoading: boolean

    // Calendar State
    currentMonth: Date
    year: number
    month: number
    calendarDays: (number | null)[]
    selectedDate: Date | null
    slideDirection: CalendarSlideDirection | null
    isPickerOpen: boolean

    // Calendar Actions
    goToPrevMonth: () => void
    goToNextMonth: () => void
    goToMonth: (year: number, month: number) => void
    goToToday: () => void
    /** 표시 중인 달이 오늘이 속한 달인지 — '오늘' 단축 버튼 노출 제어 */
    isCurrentMonth: boolean
    openPicker: () => void
    closePicker: () => void
    selectDate: (day: number) => void
    clearSelection: () => void
    scrollTick: number

    // Event Status
    getDayStatus: (day: number) => 'completed' | 'missed' | 'scheduled' | null

    // 현재 표시 중인 달의 모든 이벤트 (날짜별 그룹 렌더링용)
    eventsForMonth: PaymentEvent[]

    // 다가오는 납입 아이템 렌더링용 (아바타·금액 표시에 필요)
    records: Investment[]

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
    year,
    month,
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
    scrollTick,
    getDayStatus,
    eventsForMonth,
    records,
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
    const {
        isCollapsed,
        onListScroll,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        toggleCollapsed,
    } = useCalendarCollapse({ scrollTick })

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
                        toggleCollapsed={toggleCollapsed}
                        goToToday={goToToday}
                        isCurrentMonth={isCurrentMonth}
                    />
                </div>

                {/* 라운드 셰이프를 스크롤 컨테이너 자체에 둬서 스크롤해도 상단 라운드가 보이도록 함. 카드는 내용 높이에 맞춰 자라되 가용 공간을 넘으면 내부 스크롤. */}
                <div className="flex-1 min-h-0 flex flex-col pb-4">
                    <div
                        data-calendar-scroll
                        className="max-h-full overflow-y-auto bg-card rounded-2xl"
                        onScroll={onListScroll}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        onClick={(e) => e.stopPropagation()}
                        role="presentation"
                    >
                        <div className="px-4 pb-4">
                            <MonthAgendaSection
                                year={year}
                                month={month}
                                eventsForMonth={eventsForMonth}
                                records={records}
                                selectedDate={selectedDate}
                                scrollTick={scrollTick}
                                isEventCompleted={isEventCompleted}
                                handleComplete={handleComplete}
                            />
                        </div>
                    </div>
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
