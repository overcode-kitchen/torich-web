'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { addDays } from 'date-fns'
import { formatPaymentDateShort, getUpcomingPayments, getUpcomingPaymentsInRange } from '@/app/utils/date'
import type { Investment } from '@/app/types/investment'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'

const STORAGE_PREFIX = 'torich_completed_'

const PRESET_OPTIONS = [
  { label: '오늘', days: 1 },
  { label: '3일', days: 3 },
  { label: '7일', days: 7 },
  { label: '보름', days: 15 },
  { label: '한달', days: 30 },
  { label: '1년', days: 365 },
] as const

function getCompletedKey(investmentId: string, year: number, month: number, day: number): string {
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`
  return `${STORAGE_PREFIX}${investmentId}_${yearMonth}_${day}`
}

function isPaymentCompleted(investmentId: string, date: Date, dayOfMonth: number): boolean {
  if (typeof window === 'undefined') return false
  const key = getCompletedKey(investmentId, date.getFullYear(), date.getMonth() + 1, dayOfMonth)
  const val = localStorage.getItem(key)
  return !!val
}

function setPaymentCompleted(investmentId: string, date: Date, dayOfMonth: number): void {
  if (typeof window === 'undefined') return
  const key = getCompletedKey(investmentId, date.getFullYear(), date.getMonth() + 1, dayOfMonth)
  localStorage.setItem(key, new Date().toISOString())
}

function clearPaymentCompleted(investmentId: string, date: Date, dayOfMonth: number): void {
  if (typeof window === 'undefined') return
  const key = getCompletedKey(investmentId, date.getFullYear(), date.getMonth() + 1, dayOfMonth)
  localStorage.removeItem(key)
}

interface UpcomingItem {
  investment: Investment
  paymentDate: Date
  dayOfMonth: number
}

interface UpcomingInvestmentsProps {
  records: Investment[]
}

const TOAST_DURATION_MS = 5000

export default function UpcomingInvestments({ records }: UpcomingInvestmentsProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set())
  const [selectedPreset, setSelectedPreset] = useState<'preset' | 'custom'>('preset')
  const [selectedDays, setSelectedDays] = useState(7)
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(() => {
    const t = new Date()
    return { from: t, to: addDays(t, 6) }
  })
  const [pendingUndo, setPendingUndo] = useState<{
    investmentId: string
    date: Date
    dayOfMonth: number
  } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const items = useMemo(() => {
    if (selectedPreset === 'custom' && customDateRange?.from && customDateRange?.to) {
      const payments = getUpcomingPaymentsInRange(records, customDateRange.from, customDateRange.to)
      return payments.map((p) => {
        const inv = records.find((r) => r.id === p.id)!
        return { investment: inv, paymentDate: p.paymentDate, dayOfMonth: p.dayOfMonth }
      })
    }
    const effectiveDays = selectedDays
    const payments = getUpcomingPayments(records, effectiveDays)
    return payments.map((p) => {
      const inv = records.find((r) => r.id === p.id)!
      return { investment: inv, paymentDate: p.paymentDate, dayOfMonth: p.dayOfMonth }
    })
  }, [records, selectedPreset, selectedDays, customDateRange])

  const pendingUndoRef = useRef(pendingUndo)
  pendingUndoRef.current = pendingUndo

  const handleUndo = useCallback(() => {
    const p = pendingUndoRef.current
    if (!p) return
    clearPaymentCompleted(p.investmentId, p.date, p.dayOfMonth)
    const key = `${p.investmentId}_${p.date.getTime()}_${p.dayOfMonth}`
    setCompletedIds((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    setPendingUndo(null)
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
  }, [])

  const toggleComplete = useCallback((investmentId: string, date: Date, dayOfMonth: number) => {
    setPaymentCompleted(investmentId, date, dayOfMonth)
    const key = `${investmentId}_${date.getTime()}_${dayOfMonth}`
    setCompletedIds((prev) => new Set(prev).add(key))

    setPendingUndo({ investmentId, date, dayOfMonth })
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => {
      setPendingUndo(null)
      toastTimeoutRef.current = null
    }, TOAST_DURATION_MS)
  }, [])

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const key = `${item.investment.id}_${item.paymentDate.getTime()}_${item.dayOfMonth}`
      if (completedIds.has(key)) return false
      return !isPaymentCompleted(item.investment.id, item.paymentDate, item.dayOfMonth)
    })
  }, [items, completedIds])

  const rangeLabel =
    selectedPreset === 'custom' && customDateRange?.from && customDateRange?.to
      ? `${customDateRange.from.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${customDateRange.to.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
      : PRESET_OPTIONS.find((p) => p.days === selectedDays)?.label ?? `${selectedDays}일`

  if (records.length === 0) return null

  return (
    <div className="bg-white rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-coolgray-900">
          📅 다가오는 투자
        </h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-coolgray-200 border-coolgray-200 hover:border-coolgray-300"
              >
                {rangeLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[140px]">
              {PRESET_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.days}
                  onClick={() => {
                    setSelectedPreset('preset')
                    setSelectedDays(opt.days)
                  }}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPreset('custom')
                  const t = new Date()
                  setCustomDateRange({ from: t, to: addDays(t, 6) })
                }}
              >
                기간 선택
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 커스텀 기간 선택 */}
      {selectedPreset === 'custom' && (
        <div className="mb-4">
          <DateRangePicker
            value={customDateRange}
            onChange={setCustomDateRange}
            placeholder="기간 선택"
            buttonClassName="w-full"
          />
        </div>
      )}

      {visibleItems.length === 0 ? (
        <p className="text-sm text-coolgray-500 py-4 text-center">
          {rangeLabel} 이내 예정된 투자가 없어요
        </p>
      ) : (
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div
            key={`${item.investment.id}-${item.paymentDate.getTime()}-${item.dayOfMonth}`}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-coolgray-25 border border-coolgray-100"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-coolgray-900 truncate">
                {formatPaymentDateShort(item.paymentDate)} · {item.investment.title}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-bold text-coolgray-900">
                {formatCurrency(item.investment.monthly_amount)}
              </span>
              <button
                type="button"
                onClick={() => toggleComplete(item.investment.id, item.paymentDate, item.dayOfMonth)}
                className="px-3 py-1.5 rounded-lg border border-coolgray-200 text-coolgray-600 text-xs font-medium hover:bg-coolgray-50 hover:border-coolgray-300 transition-colors"
                aria-label="납입 완료 체크"
              >
                완료하기
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* 되돌리기 토스트 */}
      {pendingUndo && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-coolgray-900 text-white px-4 py-3 shadow-lg"
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
    </div>
  )
}
