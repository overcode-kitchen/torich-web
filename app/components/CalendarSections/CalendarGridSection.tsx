import type { SwipeHandlers } from '@/app/hooks/useSwipe'
import type { CalendarSlideDirection } from '@/app/hooks/calendar/useCalendar'

interface CalendarGridSectionProps {
  currentMonth: Date
  calendarDays: (number | null)[]
  selectedDate: Date | null
  getDayStatus: (day: number) => 'completed' | 'missed' | 'scheduled' | null
  selectDate: (day: number) => void
  clearSelection: () => void
  /** 그리드 좌우 스와이프로 월을 이동하는 제스처 핸들러 */
  swipeHandlers: SwipeHandlers
  /** 월 전환 슬라이드 애니메이션 방향 (null: 최초 로드, 애니메이션 없음) */
  slideDirection: CalendarSlideDirection | null
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
}: CalendarGridSectionProps) {
  // 월이 바뀔 때마다 key가 갱신되어 진입 애니메이션이 재실행된다
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
  // 최초 로드(slideDirection === null)에는 애니메이션을 적용하지 않는다
  const animationClass = slideDirection
    ? `animate-in fade-in duration-300 ease-out motion-reduce:animate-none ${
        slideDirection === 'next' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'
      }`
    : ''
  return (
    /* 캘린더 그리드 */
    <div
      className="bg-card rounded-2xl p-4 mb-4 touch-pan-y select-none"
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
      <div
        key={monthKey}
        className={`grid grid-cols-7 gap-x-1 gap-y-1.5 ${animationClass}`}
      >
        {calendarDays.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="aspect-square cursor-pointer"
                onClick={clearSelection}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && clearSelection()}
                aria-label="선택 해제"
              />
            )
          }
          const status = getDayStatus(day)
          const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth()
          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDate(day)}
              className={`relative aspect-square w-full rounded-lg flex items-center justify-center text-center text-sm transition-colors ${
                isSelected
                  ? 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] ring-1 ring-brand-500'
                  : 'text-foreground-soft hover:bg-surface-hover'
              }`}
            >
              {/* 날짜는 셀 중앙 고정, 도트는 셀 하단에서 일정 간격을 두고 absolute로 배치한다 */}
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
                    status === 'completed' ? 'bg-green-500' : status === 'missed' ? 'bg-red-500' : 'bg-surface-strong-hover'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>
      {/* 색상 범례 */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border-subtle">
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
  )
}
