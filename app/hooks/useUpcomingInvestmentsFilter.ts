import { useState, useCallback, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'

export const PRESET_OPTIONS = [
  { label: '오늘', days: 1 },
  { label: '3일', days: 3 },
  { label: '7일', days: 7 },
  { label: '보름', days: 15 },
  { label: '한달', days: 30 },
  { label: '1년', days: 365 },
] as const

export function useUpcomingInvestmentsFilter() {
  const [selectedPreset, setSelectedPreset] = useState<'preset' | 'custom'>('preset')
  const [selectedDays, setSelectedDays] = useState(7)
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(() => {
    const t = new Date()
    return { from: t, to: addDays(t, 6) }
  })

  const selectPreset = useCallback((days: number) => {
    setSelectedPreset('preset')
    setSelectedDays(days)
  }, [])

  const selectCustomPreset = useCallback(() => {
    setSelectedPreset('custom')
    const t = new Date()
    setCustomDateRange({ from: t, to: addDays(t, 6) })
  }, [])

  const rangeLabel = useMemo(() => {
    if (selectedPreset === 'custom' && customDateRange?.from && customDateRange?.to) {
      return `${customDateRange.from.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${customDateRange.to.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
    }
    return PRESET_OPTIONS.find((p) => p.days === selectedDays)?.label ?? `${selectedDays}일`
  }, [selectedPreset, customDateRange, selectedDays])

  return {
    selectedPreset,
    setSelectedPreset,
    selectedDays,
    setSelectedDays,
    customDateRange,
    setCustomDateRange,
    selectPreset,
    selectCustomPreset,
    rangeLabel,
  }
}
