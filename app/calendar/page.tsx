'use client'

import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CircleNotch, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/utils'
import { Investment, getStartDate } from '@/app/types/investment'
import { isCompleted } from '@/app/utils/date'
import {
  getPaymentEventsForMonth,
  type PaymentEvent,
} from '@/app/utils/stats'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// 기존 훅 재사용
import { useAuth } from '@/app/hooks/useAuth'
import { useInvestments } from '@/app/hooks/useInvestments'

// 새로 만든 훅
import { useCalendar } from '@/app/hooks/useCalendar'
import { usePaymentCompletion } from '@/app/hooks/usePaymentCompletion'

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

  const isLoading = authLoading || recordsLoading

  // 활성 투자 필터링 (정렬 포함)
  const activeRecords = useMemo(() => {
    return records
      .filter((r) => {
        const start = getStartDate(r)
        return !isCompleted(start, r.period_years)
      })
      .sort((a, b) => {
        // created_at 내림차순 정렬
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
  }, [records])

  const eventsForMonth = useMemo(
    () => getPaymentEventsForMonth(activeRecords, year, month),
    [activeRecords, year, month]
  )

  const eventsByDay = useMemo(() => {
    const map = new Map<number, PaymentEvent[]>()
    for (const e of eventsForMonth) {
      const list = map.get(e.day) || []
      list.push(e)
      map.set(e.day, list)
    }
    return map
  }, [eventsForMonth])


  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    if (selectedDate.getFullYear() !== year || selectedDate.getMonth() !== month - 1) return []
    const d = selectedDate.getDate()
    return eventsByDay.get(d) || []
  }, [selectedDate, eventsByDay, year, month])


  const getDayStatus = (day: number) => {
    const events = eventsByDay.get(day) || []
    if (events.length === 0) return null
    const today = new Date()
    const isPast = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1) || (year === today.getFullYear() && month === today.getMonth() + 1 && day < today.getDate())
    const allCompleted = events.every((ev) => isEventCompleted(ev))
    if (allCompleted) return 'completed'
    if (isPast) return 'missed'
    return 'scheduled'
  }

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
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-4">캘린더</h1>

        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="p-2 text-foreground-muted hover:text-foreground"
          >
            <CaretLeft className="w-6 h-6" />
          </button>
          <span className="text-lg font-semibold text-foreground">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-2 text-foreground-muted hover:text-foreground"
          >
            <CaretRight className="w-6 h-6" />
          </button>
        </div>

        {/* 캘린더 그리드 */}
        <div
          className="bg-card rounded-2xl p-4 mb-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
              <div key={w} className="text-center text-xs font-medium text-muted-foreground py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
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
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${
                    isSelected ? 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] ring-2 ring-brand-500' : 'hover:bg-surface-hover'
                  }`}
                >
                  <span className="font-medium">{day}</span>
                  {status && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
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

        {/* 선택된 날짜의 투자 목록 */}
        {selectedDate && (
          <div
            className="bg-card rounded-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-foreground-soft mb-3">
              {format(selectedDate, 'M월 d일', { locale: ko })} 예정 투자
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">해당 날짜에 예정된 투자가 없어요</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((e) => {
                  const done = isEventCompleted(e)
                  return (
                    <div
                      key={`${e.investmentId}-${e.day}`}
                      className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{e.title}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(e.monthlyAmount)}</p>
                      </div>
                      {done ? (
                        <span className="text-green-600 text-sm font-medium">✓ 완료됨</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleComplete(e)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                          aria-label="납입 완료 체크"
                        >
                          완료하기
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 되돌리기 토스트 */}
      {pendingUndo && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-surface-dark text-white px-4 py-3 shadow-lg"
          role="status"
        >
          <span className="text-sm font-medium">완료됨</span>
          <button
            type="button"
            onClick={handleUndo}
            className="text-sm font-semibold text-brand-300 hover:text-brand-200 transition-colors"
          >
            되돌리기
          </button>
        </div>
      )}
    </main>
  )
}
