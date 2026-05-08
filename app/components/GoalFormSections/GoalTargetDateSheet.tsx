'use client'

import { X } from '@phosphor-icons/react'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

function AdaptiveDayButton(props: React.ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton
      {...props}
      className={cn(props.className, 'aspect-auto h-10')}
    />
  )
}

interface GoalTargetDateSheetProps {
  selectedDate: Date | null
  onSelect: (date: Date) => void
  onClear: () => void
  onClose: () => void
}

export default function GoalTargetDateSheet({
  selectedDate,
  onSelect,
  onClear,
  onClose,
}: GoalTargetDateSheetProps) {
  const initialMonth = selectedDate ?? new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-md bg-card rounded-t-3xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-surface-strong rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 pb-4 shrink-0">
          <h2 className="text-lg font-bold text-foreground">마감일 선택</h2>
          <button
            onClick={onClose}
            className="p-1 text-foreground-subtle hover:text-foreground-muted transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-4">
            <Calendar
              mode="single"
              selected={selectedDate ?? undefined}
              defaultMonth={initialMonth}
              fixedWeeks
              className="w-full"
              classNames={{
                root: 'w-full',
                day: 'relative w-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day select-none',
                today:
                  'bg-surface font-semibold text-foreground rounded-xl data-[selected=true]:rounded-none',
              }}
              components={{
                DayButton: AdaptiveDayButton,
              }}
              onSelect={(date: Date | undefined) => {
                if (date) {
                  onSelect(date)
                  onClose()
                }
              }}
            />
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => {
              onClear()
              onClose()
            }}
            className="text-sm font-medium text-foreground-subtle hover:text-foreground-soft transition-colors"
          >
            삭제
          </button>
          <p className="text-sm text-foreground-soft">
            {selectedDate
              ? selectedDate.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })
              : '마감일 없음'}
          </p>
        </div>
      </div>
    </div>
  )
}
