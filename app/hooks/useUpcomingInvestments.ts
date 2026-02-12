'use client'

import { useState, useMemo } from 'react'
import { addDays } from 'date-fns'
import { getUpcomingPayments, getUpcomingPaymentsInRange } from '@/app/utils/date'
import type { Investment } from '@/app/types/investment'
import type { DateRange } from 'react-day-picker'
import type { PaymentEvent } from '@/app/utils/stats'

const PRESET_OPTIONS = [
  { label: '오늘', days: 1 },
  { label: '3일', days: 3 },
  { label: '7일', days: 7 },
  { label: '보름', days: 15 },
  { label: '한달', days: 30 },
  { label: '1년', days: 365 },
] as const

export interface UpcomingItem {
  investment: Investment
  paymentDate: Date
  dayOfMonth: number
}

interface UseUpcomingInvestmentsProps {
  records: Investment[]
  isEventCompleted: (event: PaymentEvent) => boolean
}

export function useUpcomingInvestments({ 
  records, 
  isEventCompleted 
}: UseUpcomingInvestmentsProps) {
  const [selectedPreset, setSelectedPreset] = useState<'preset' | 'custom'>('preset')
  const [selectedDays, setSelectedDays] = useState(7)
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(() => {
    const t = new Date()
    return { from: t, to: addDays(t, 6) }
  })

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

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const event: PaymentEvent = {
        investmentId: item.investment.id,
        year: item.paymentDate.getFullYear(),
        month: item.paymentDate.getMonth() + 1,
        day: item.dayOfMonth,
        yearMonth: `${item.paymentDate.getFullYear()}-${String(item.paymentDate.getMonth() + 1).padStart(2, '0')}`,
        monthlyAmount: item.investment.monthly_amount,
        title: item.investment.title
      }
      return !isEventCompleted(event)
    })
  }, [items, isEventCompleted])

  const rangeLabel = useMemo(() => 
    selectedPreset === 'custom' && customDateRange?.from && customDateRange?.to
      ? `${customDateRange.from.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${customDateRange.to.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
      : PRESET_OPTIONS.find((p) => p.days === selectedDays)?.label ?? `${selectedDays}일`
  , [selectedPreset, selectedDays, customDateRange])

  const handlePresetSelect = (days: number) => {
    setSelectedPreset('preset')
    setSelectedDays(days)
  }

  const handleCustomRangeSelect = () => {
    setSelectedPreset('custom')
    const t = new Date()
    setCustomDateRange({ from: t, to: addDays(t, 6) })
  }

  const createPaymentEvent = (item: UpcomingItem): PaymentEvent => ({
    investmentId: item.investment.id,
    year: item.paymentDate.getFullYear(),
    month: item.paymentDate.getMonth() + 1,
    day: item.dayOfMonth,
    yearMonth: `${item.paymentDate.getFullYear()}-${String(item.paymentDate.getMonth() + 1).padStart(2, '0')}`,
    monthlyAmount: item.investment.monthly_amount,
    title: item.investment.title
  })

  return {
    // State
    selectedPreset,
    selectedDays,
    customDateRange,
    setCustomDateRange,
    
    // Computed values
    items,
    visibleItems,
    rangeLabel,
    presetOptions: PRESET_OPTIONS,
    
    // Actions
    handlePresetSelect,
    handleCustomRangeSelect,
    createPaymentEvent
  }
}
