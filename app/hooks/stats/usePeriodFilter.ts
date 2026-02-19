import { useState } from 'react'
import { subDays } from 'date-fns'
import type { DateRange } from 'react-day-picker'

export type PeriodPreset = '1' | '3' | '6' | '12' | 'custom'

export interface UsePeriodFilterReturn {
  periodPreset: PeriodPreset
  setPeriodPreset: (preset: PeriodPreset) => void
  customDateRange: DateRange | undefined
  setCustomDateRange: (range: DateRange | undefined) => void
  isCustomRange: boolean
  effectiveMonths: number
  periodLabel: string
  handleCustomPeriod: () => void
}

export function usePeriodFilter(): UsePeriodFilterReturn {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('6')
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(() => {
    const end = new Date()
    const start = subDays(end, 6)
    return { from: start, to: end }
  })

  const isCustomRange = periodPreset === 'custom' && !!customDateRange?.from && !!customDateRange?.to
  const effectiveMonths = periodPreset === 'custom' ? 6 : parseInt(periodPreset, 10)

  const periodLabel =
    periodPreset === '1'
      ? '이번 달'
      : periodPreset === 'custom' && isCustomRange
        ? `${customDateRange!.from!.toLocaleDateString('ko-KR', { month: 'short', year: 'numeric' })} - ${customDateRange!.to!.toLocaleDateString('ko-KR', { month: 'short', year: 'numeric' })}`
        : `최근 ${effectiveMonths}개월`

  const handleCustomPeriod = () => {
    setPeriodPreset('custom')
    const end = new Date()
    setCustomDateRange({ from: subDays(end, 6), to: end })
  }

  return {
    periodPreset,
    setPeriodPreset,
    customDateRange,
    setCustomDateRange,
    isCustomRange,
    effectiveMonths,
    periodLabel,
    handleCustomPeriod,
  }
}
