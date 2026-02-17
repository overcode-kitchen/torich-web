import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { Investment } from '@/app/types/investment'
import type { DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'
import { getUpcomingPayments, getUpcomingPaymentsInRange } from '@/app/utils/date'
import { usePaymentHistory } from './usePaymentHistory'
import { isPaymentCompleted } from '@/app/utils/payment-completion'

export interface DisplayItem {
  investment: Investment
  paymentDate: Date
  dayOfMonth: number
}

export const PRESET_OPTIONS = [
  { label: '오늘', days: 1 },
  { label: '3일', days: 3 },
  { label: '7일', days: 7 },
  { label: '보름', days: 15 },
  { label: '한달', days: 30 },
  { label: '1년', days: 365 },
] as const

const TOAST_DURATION_MS = 5000
const INITIAL_VISIBLE_COUNT = 5

export function useUpcomingInvestments(records: Investment[]) {
  const { completedPayments, togglePayment, isLoading } = usePaymentHistory()

  const [selectedPreset, setSelectedPreset] = useState<'preset' | 'custom'>('preset')
  const [expanded, setExpanded] = useState(false)
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
    const payments = getUpcomingPayments(records, selectedDays)
    return payments.map((p) => {
      const inv = records.find((r) => r.id === p.id)!
      return { investment: inv, paymentDate: p.paymentDate, dayOfMonth: p.dayOfMonth }
    })
  }, [records, selectedPreset, selectedDays, customDateRange])

  const pendingUndoRef = useRef(pendingUndo)
  pendingUndoRef.current = pendingUndo

  const getFormatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const handleUndo = useCallback(() => {
    const p = pendingUndoRef.current
    if (!p) return

    // Undo means toggling back. Logic: if it allowed undo, it means we marked it as completed.
    // So current status in DB/Map is "completed". We want to revert to "incomplete".
    // Is that right? 
    // toggleComplete marks as completed.
    // So we want to mark as incomplete.
    // togglePayment takes current status. If current is true (completed), it deletes.
    // So we pass true (it IS completed now).
    // Or we use `isPaymentCompleted` to check current status.
    // Let's rely on what we did. We did `toggleComplete` -> it became completed.

    const dateStr = getFormatDate(p.date)
    togglePayment(p.investmentId, dateStr, true) // Undo completion -> set to incomplete

    setPendingUndo(null)
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
  }, [togglePayment])

  const toggleComplete = useCallback((investmentId: string, date: Date, dayOfMonth: number) => {
    const dateStr = getFormatDate(date)
    // We assume we are marking as completed (since this is "Upcoming" section, items are incomplete)
    // But `togglePayment` handles toggle. 
    // If it is in list, it is incomplete.
    togglePayment(investmentId, dateStr, false) // Mark as completed

    setPendingUndo({ investmentId, date, dayOfMonth })
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => {
      setPendingUndo(null)
      toastTimeoutRef.current = null
    }, TOAST_DURATION_MS)
  }, [togglePayment])

  const selectPreset = useCallback((days: number) => {
    setSelectedPreset('preset')
    setSelectedDays(days)
  }, [])

  const selectCustomPreset = useCallback(() => {
    setSelectedPreset('custom')
    const t = new Date()
    setCustomDateRange({ from: t, to: addDays(t, 6) })
  }, [])

  const visibleItems = useMemo(() => {
    if (isLoading) return []
    return items.filter((item) => {
      return !isPaymentCompleted(completedPayments, item.investment.id, item.paymentDate.getFullYear(), item.paymentDate.getMonth() + 1, item.paymentDate.getDate())
    })
  }, [items, completedPayments, isLoading])

  const displayItems = expanded ? visibleItems : visibleItems.slice(0, INITIAL_VISIBLE_COUNT)
  const hasMore = visibleItems.length > INITIAL_VISIBLE_COUNT
  const remainingCount = visibleItems.length - INITIAL_VISIBLE_COUNT

  const rangeLabel =
    selectedPreset === 'custom' && customDateRange?.from && customDateRange?.to
      ? `${customDateRange.from.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${customDateRange.to.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
      : PRESET_OPTIONS.find((p) => p.days === selectedDays)?.label ?? `${selectedDays}일`

  return {
    selectedPreset,
    setSelectedPreset,
    selectedDays,
    setSelectedDays,
    customDateRange,
    setCustomDateRange,
    expanded,
    setExpanded,
    pendingUndo,
    handleUndo,
    toggleComplete,
    selectPreset,
    selectCustomPreset,
    displayItems,
    hasMore,
    remainingCount,
    rangeLabel,
    visibleItemsCount: visibleItems.length,
    isLoading
  }
}
