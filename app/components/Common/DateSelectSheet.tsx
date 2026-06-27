'use client'

import { useEffect, useRef, useState } from 'react'
import { CaretDown, CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { ko } from 'date-fns/locale'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// aspect-square를 제거해 너비만 가변되고 높이는 고정되게 함
function AdaptiveDayButton(props: React.ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton
      {...props}
      className={cn(props.className, 'aspect-auto h-10')}
    />
  )
}

const ITEM_H = 40 // 휠 한 칸 높이(px)

/**
 * 스크롤 휠 컬럼 — iOS 스타일 픽커.
 * 가운데 칸에 오는 항목이 선택값. 스크롤이 멈추면 가장 가까운 칸으로 스냅한다.
 */
function WheelColumn({
  items,
  value,
  onChange,
  format,
}: {
  items: number[]
  value: number
  onChange: (value: number) => void
  format: (value: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [active, setActive] = useState<number>(() =>
    Math.max(0, items.indexOf(value)),
  )

  // 마운트 시 현재 값 위치로 스크롤 정렬
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = active * ITEM_H
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    const idx = Math.max(
      0,
      Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)),
    )
    if (idx !== active) setActive(idx)

    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
      if (items[idx] !== value) onChange(items[idx])
    }, 120)
  }

  const selectAt = (idx: number) => {
    setActive(idx)
    ref.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
    if (items[idx] !== value) onChange(items[idx])
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="h-[200px] overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* 첫/마지막 항목이 가운데 올 수 있도록 위아래 여백 (= (200-40)/2 = 80) */}
      <div style={{ height: ITEM_H * 2 }} />
      {items.map((it, i) => (
        <button
          key={it}
          type="button"
          onClick={() => selectAt(i)}
          className={cn(
            'flex h-10 w-full snap-center items-center justify-center text-base transition-colors',
            i === active
              ? 'font-bold text-foreground'
              : 'text-foreground-subtle',
          )}
        >
          {format(it)}
        </button>
      ))}
      <div style={{ height: ITEM_H * 2 }} />
    </div>
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
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

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
}: DateSelectSheetProps) {
  const currentYear = new Date().getFullYear()
  const selectedYear = selectedDate?.getFullYear() ?? currentYear
  // 휠 연도 범위: 과거 선택값도 포괄하고, 장기 목표를 위해 +30년까지 노출.
  const startYear = Math.min(currentYear, selectedYear)
  const endYear = Math.max(currentYear + 30, selectedYear)
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i,
  )

  const [month, setMonth] = useState<Date>(selectedDate ?? new Date())
  const [pickerOpen, setPickerOpen] = useState(false)

  const atStart = month.getFullYear() === startYear && month.getMonth() === 0
  const atEnd = month.getFullYear() === endYear && month.getMonth() === 11

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
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              disabled={atStart}
              className="p-1.5 rounded-lg text-foreground-subtle hover:bg-surface disabled:opacity-30 transition-colors"
              aria-label="이전 달"
            >
              <CaretLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              disabled={atEnd}
              className="p-1.5 rounded-lg text-foreground-subtle hover:bg-surface disabled:opacity-30 transition-colors"
              aria-label="다음 달"
            >
              <CaretRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {pickerOpen ? (
          // 연/월 스크롤 휠 픽커
          <div className="px-6 pb-2 shrink-0">
            <div className="relative">
              {/* 가운데 선택 밴드 */}
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-lg bg-surface" />
              <div className="relative grid grid-cols-2">
                <WheelColumn
                  items={years}
                  value={month.getFullYear()}
                  onChange={(y) =>
                    setMonth((m) => new Date(y, m.getMonth(), 1))
                  }
                  format={(y) => `${y}년`}
                />
                <WheelColumn
                  items={MONTHS}
                  value={month.getMonth() + 1}
                  onChange={(mm) =>
                    setMonth((m) => new Date(m.getFullYear(), mm - 1, 1))
                  }
                  format={(mm) => `${mm}월`}
                />
              </div>
            </div>
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

        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle shrink-0">
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
    </div>
  )
}
