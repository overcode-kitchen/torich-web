'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CaretDown, CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { ko } from 'date-fns/locale'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import YearMonthWheel from './YearMonthWheel'

// aspect-square를 제거해 너비만 가변되고 높이는 고정되게 함
function AdaptiveDayButton(props: React.ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton
      {...props}
      className={cn(props.className, 'aspect-auto h-10')}
    />
  )
}

interface DateSelectSheetProps {
  selectedDate: Date | null
  onSelect: (date: Date) => void
  onClose: () => void
  /** 시트 헤더 제목 */
  title?: string
  /** 제공 시 "삭제" 버튼을 노출하고 날짜 비우기를 허용한다. */
  onClear?: () => void
  /** 날짜 미선택 시 푸터에 표시할 문구 */
  emptyLabel?: string
  /** 연도 휠을 올해보다 과거로 몇 년까지 열지 (시작일 등 과거 선택용). 기본 0(과거 불가). */
  pastYears?: number
  /**
   * 이 날짜보다 이전은 선택할 수 없게 한다 (만기일·종료일처럼 미래여야 하는 값).
   * 이미 저장된 과거 날짜는 계속 보이고 선택 상태도 유지된다 — 새로 고를 수만 없다.
   */
  minDate?: Date
}

function shiftMonth(base: Date, delta: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1)
}

/**
 * 서비스 공용 날짜 선택 바텀 시트.
 * - 상단 "YYYY년 M월 ⌄" 라벨을 누르면 연/월 스크롤 휠 픽커가 열린다.
 * - 한글 로케일(요일·월) 적용.
 * - onClear 제공 여부로 "선택형(삭제 가능)" / "필수형"을 구분한다.
 */
export default function DateSelectSheet({
  selectedDate,
  onSelect,
  onClose,
  title = '날짜 선택',
  onClear,
  emptyLabel = '선택 안 함',
  pastYears = 0,
  minDate,
}: DateSelectSheetProps) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const selectedYear = selectedDate?.getFullYear() ?? currentYear
  // 휠 연도 범위: 과거 선택값·pastYears(과거 시작일 등)를 포괄하고, 장기 목표를 위해 +30년까지 노출.
  const startYear = Math.min(currentYear - pastYears, selectedYear)
  const endYear = Math.max(currentYear + 30, selectedYear)

  const [month, setMonth] = useState<Date>(selectedDate ?? new Date())
  const [pickerOpen, setPickerOpen] = useState(false)

  const atStart = month.getFullYear() === startYear && month.getMonth() === 0
  const atEnd = month.getFullYear() === endYear && month.getMonth() === 11

  // 조상(SubPageScaffold의 animate-page-in transform 등)이 만드는 stacking context 밖으로
  // 빼기 위해 body로 포털 렌더한다. 이래야 시트가 페이지 고정 하단 바 위로 온전히 덮인다.
  if (typeof document === 'undefined') return null

  return createPortal(
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
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-foreground-subtle hover:text-foreground-muted transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 자체 년/월 헤더 — 라벨 드롭다운 + 이전/다음 이동 */}
        <div className="flex items-center justify-between px-6 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 -ml-2 text-base font-semibold text-foreground hover:bg-surface transition-colors"
            aria-expanded={pickerOpen}
          >
            <span>{`${month.getFullYear()}년 ${month.getMonth() + 1}월`}</span>
            <CaretDown
              className={cn(
                'w-4 h-4 text-foreground-subtle transition-transform',
                pickerOpen && 'rotate-180',
              )}
            />
          </button>

          <div className={cn('flex items-center gap-1', pickerOpen && 'invisible')}>
            <button
              type="button"
              onClick={() => setMonth(new Date(currentYear, today.getMonth(), 1))}
              className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-foreground-subtle hover:bg-surface transition-colors"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              disabled={atStart}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground-subtle hover:bg-surface disabled:opacity-30 transition-colors"
              aria-label="이전 달"
            >
              <CaretLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              disabled={atEnd}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground-subtle hover:bg-surface disabled:opacity-30 transition-colors"
              aria-label="다음 달"
            >
              <CaretRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {pickerOpen ? (
          // 연/월 스크롤 휠 픽커
          <div className="px-6 pb-2 shrink-0">
            <YearMonthWheel
              year={month.getFullYear()}
              month={month.getMonth() + 1}
              startYear={startYear}
              endYear={endYear}
              onChange={(y, m) => setMonth(new Date(y, m - 1, 1))}
            />
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              완료
            </button>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 pb-4">
              <Calendar
                mode="single"
                locale={ko}
                month={month}
                onMonthChange={setMonth}
                startMonth={new Date(startYear, 0, 1)}
                endMonth={new Date(endYear, 11, 31)}
                selected={selectedDate ?? undefined}
                disabled={minDate ? { before: minDate } : undefined}
                fixedWeeks
                className="w-full"
                classNames={{
                  root: 'w-full',
                  // 자체 헤더를 쓰므로 라이브러리 기본 캡션·내비게이션은 숨김
                  month_caption: 'hidden',
                  nav: 'hidden',
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
        )}

        <div
          className="flex items-center justify-between px-6 pt-4 border-t border-border-subtle shrink-0"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          {onClear ? (
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
          ) : (
            <span />
          )}
          <p className="text-sm text-foreground-soft">
            {selectedDate
              ? selectedDate.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })
              : emptyLabel}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
