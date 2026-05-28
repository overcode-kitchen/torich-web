import { CaretDown } from '@phosphor-icons/react'
import type { SwipeHandlers } from '@/app/hooks/useSwipe'
import type { CalendarSlideDirection } from '@/app/hooks/calendar/useCalendar'

interface CalendarGridSectionProps {
  currentMonth: Date
  calendarDays: (number | null)[]
  selectedDate: Date | null
  getDayStatus: (day: number) => 'completed' | 'missed' | 'scheduled' | null
  selectDate: (day: number) => void
  clearSelection: () => void
  swipeHandlers: SwipeHandlers
  slideDirection: CalendarSlideDirection | null
  /** true면 포커스된 주만 노출하고 나머지 주 행을 접는다 */
  isCollapsed: boolean
  /** 접힘 상태에서만 카드 하단에 등장하는 펼침 토글 */
  toggleCollapsed: () => void
}

function chunkWeeks(days: (number | null)[]): (number | null)[][] {
  const weeks: (number | null)[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

function getFocusedWeekIndex(
  weeks: (number | null)[][],
  currentMonth: Date,
  selectedDate: Date | null
): number {
  const ref = selectedDate ?? new Date()
  const sameMonth =
    ref.getFullYear() === currentMonth.getFullYear() &&
    ref.getMonth() === currentMonth.getMonth()
  if (!sameMonth) return 0
  const targetDay = ref.getDate()
  const idx = weeks.findIndex((w) => w.includes(targetDay))
  return idx >= 0 ? idx : 0
}

export function CalendarGridSection({
  currentMonth,
  calendarDays,
  selectedDate,
  getDayStatus,
  selectDate,
  clearSelection,
  swipeHandlers,
  slideDirection,
  isCollapsed,
  toggleCollapsed,
}: CalendarGridSectionProps) {
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
  const animationClass = slideDirection
    ? `animate-in fade-in duration-300 ease-out motion-reduce:animate-none ${
        slideDirection === 'next' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'
      }`
    : ''

  const weeks = chunkWeeks(calendarDays)
  const focusedWeekIndex = getFocusedWeekIndex(weeks, currentMonth, selectedDate)

  return (
    <div
      className="bg-card rounded-2xl p-4 mb-3 touch-pan-y select-none"
      onClick={(e) => e.stopPropagation()}
      {...swipeHandlers}
    >
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
          <div key={w} className="text-center text-xs font-medium text-muted-foreground py-1">
            {w}
          </div>
        ))}
      </div>
      <div key={monthKey} className={animationClass}>
        {weeks.map((week, wi) => {
          const isHidden = isCollapsed && wi !== focusedWeekIndex
          return (
            <div
              key={wi}
              aria-hidden={isHidden}
              className={`grid grid-cols-7 gap-x-1 overflow-hidden transition-[max-height,opacity,margin-top] duration-300 ease-out motion-reduce:transition-none ${
                isHidden
                  ? 'max-h-0 opacity-0 mt-0 pointer-events-none'
                  : 'max-h-20 opacity-100 mt-1.5'
              }`}
            >
              {week.map((day, di) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${wi}-${di}`}
                      className="aspect-square cursor-pointer"
                      onClick={clearSelection}
                      role="button"
                      tabIndex={isHidden ? -1 : 0}
                      onKeyDown={(e) => e.key === 'Enter' && clearSelection()}
                      aria-label="선택 해제"
                    />
                  )
                }
                const status = getDayStatus(day)
                const isSelected =
                  selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === currentMonth.getMonth()
                return (
                  <button
                    key={day}
                    type="button"
                    tabIndex={isHidden ? -1 : 0}
                    onClick={() => selectDate(day)}
                    className={`relative aspect-square w-full rounded-lg flex items-center justify-center text-center text-sm transition-colors ${
                      isSelected
                        ? 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] ring-1 ring-inset ring-brand-500'
                        : 'text-foreground-soft hover:bg-surface-hover'
                    }`}
                  >
                    <span
                      className={`font-medium -translate-y-1 transition-transform duration-200 ease-out ${
                        isSelected ? 'scale-110' : 'scale-100'
                      }`}
                    >
                      {day}
                    </span>
                    {status && (
                      <span
                        className={`absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full transition-transform duration-200 ease-out ${
                          isSelected ? 'scale-110' : 'scale-100'
                        } ${
                          status === 'completed'
                            ? 'bg-green-500'
                            : status === 'missed'
                              ? 'bg-red-500'
                              : 'bg-surface-strong-hover'
                        }`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      <div
        className={`overflow-hidden transition-[max-height,opacity,margin-top,padding-top] duration-300 ease-out motion-reduce:transition-none ${
          isCollapsed
            ? 'max-h-0 opacity-0 mt-0 pt-0 border-t-0'
            : 'max-h-12 opacity-100 mt-3 pt-3 border-t border-border-subtle'
        }`}
        aria-hidden={isCollapsed}
      >
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-foreground-muted">완료됨</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-foreground-muted">미완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-surface-strong-hover" />
            <span className="text-xs text-foreground-muted">예정</span>
          </div>
        </div>
      </div>
      <div
        className={`overflow-hidden transition-[max-height,opacity,margin-top] duration-300 ease-out motion-reduce:transition-none ${
          isCollapsed ? 'max-h-6 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'
        }`}
        aria-hidden={!isCollapsed}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="캘린더 펼치기"
          tabIndex={isCollapsed ? 0 : -1}
          className="w-full flex items-center justify-center text-foreground-subtle hover:text-foreground-muted"
        >
          <CaretDown className="w-3 h-3 scale-x-[2]" />
        </button>
      </div>
    </div>
  )
}
