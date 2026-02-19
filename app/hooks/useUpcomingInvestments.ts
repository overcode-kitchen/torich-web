import { useState, useMemo } from 'react'
import type { Investment } from '@/app/types/investment'
import { getUpcomingPayments, getUpcomingPaymentsInRange } from '@/app/utils/date'
import { usePaymentHistory } from './usePaymentHistory'
import { isPaymentCompleted } from '@/app/utils/payment-completion'
import { useUpcomingInvestmentsFilter, PRESET_OPTIONS } from './useUpcomingInvestmentsFilter'
import { useUpcomingInvestmentsCompletion } from './useUpcomingInvestmentsCompletion'

export interface DisplayItem {
  investment: Investment
  paymentDate: Date
  dayOfMonth: number
}

// Re-export for backward compatibility
export { PRESET_OPTIONS }

const INITIAL_VISIBLE_COUNT = 5

export function useUpcomingInvestments(records: Investment[]) {
  const { completedPayments, isLoading } = usePaymentHistory()
  const [expanded, setExpanded] = useState(false)

  // 날짜 범위 필터링 로직
  const filter = useUpcomingInvestmentsFilter()

  // 완료/Undo 로직
  const completion = useUpcomingInvestmentsCompletion()

  // 아이템 계산
  const items = useMemo(() => {
    if (filter.selectedPreset === 'custom' && filter.customDateRange?.from && filter.customDateRange?.to) {
      const payments = getUpcomingPaymentsInRange(
        records,
        filter.customDateRange.from,
        filter.customDateRange.to
      )
      return payments.map((p) => {
        const inv = records.find((r) => r.id === p.id)!
        return { investment: inv, paymentDate: p.paymentDate, dayOfMonth: p.dayOfMonth }
      })
    }
    const payments = getUpcomingPayments(records, filter.selectedDays)
    return payments.map((p) => {
      const inv = records.find((r) => r.id === p.id)!
      return { investment: inv, paymentDate: p.paymentDate, dayOfMonth: p.dayOfMonth }
    })
  }, [records, filter.selectedPreset, filter.selectedDays, filter.customDateRange])

  // 완료되지 않은 아이템만 필터링
  const visibleItems = useMemo(() => {
    if (isLoading) return []
    return items.filter((item) => {
      return !isPaymentCompleted(
        completedPayments,
        item.investment.id,
        item.paymentDate.getFullYear(),
        item.paymentDate.getMonth() + 1,
        item.paymentDate.getDate()
      )
    })
  }, [items, completedPayments, isLoading])

  // 표시할 아이템 계산
  const displayItems = expanded ? visibleItems : visibleItems.slice(0, INITIAL_VISIBLE_COUNT)
  const hasMore = visibleItems.length > INITIAL_VISIBLE_COUNT
  const remainingCount = visibleItems.length - INITIAL_VISIBLE_COUNT

  return {
    // 필터 관련
    selectedPreset: filter.selectedPreset,
    setSelectedPreset: filter.setSelectedPreset,
    selectedDays: filter.selectedDays,
    setSelectedDays: filter.setSelectedDays,
    customDateRange: filter.customDateRange,
    setCustomDateRange: filter.setCustomDateRange,
    selectPreset: filter.selectPreset,
    selectCustomPreset: filter.selectCustomPreset,
    rangeLabel: filter.rangeLabel,

    // UI 상태
    expanded,
    setExpanded,

    // 완료 관련
    pendingUndo: completion.pendingUndo,
    handleUndo: completion.handleUndo,
    toggleComplete: completion.toggleComplete,

    // 아이템 관련
    displayItems,
    hasMore,
    remainingCount,
    visibleItemsCount: visibleItems.length,
    isLoading,
  }
}
