'use client'

import { useMemo, useState } from 'react'
import type { Investment } from '@/app/types/investment'
import { getStartDate } from '@/app/types/investment'
import { getDaysUntilNextPayment, getElapsedMonths, isCompleted } from '@/app/utils/date'

type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'

type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

type UseInvestmentFilterReturn = {
  filterStatus: FilterStatus
  setFilterStatus: (status: FilterStatus) => void
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  filteredRecords: Investment[]
  activeRecords: Investment[]
  totalMonthlyPayment: number
}

export function useInvestmentFilter(
  records: Investment[],
): UseInvestmentFilterReturn {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ACTIVE')
  const [sortBy, setSortBy] = useState<SortBy>('TOTAL_VALUE')

  const totalMonthlyPayment: number = useMemo((): number => {
    return records.reduce((sum: number, record: Investment): number => sum + record.monthly_amount, 0)
  }, [records])

  const activeRecords: Investment[] = useMemo((): Investment[] => {
    return records.filter((r: Investment): boolean => {
      const start: Date = getStartDate(r)
      return !isCompleted(start, r.period_years)
    })
  }, [records])

  const filteredRecords: Investment[] = useMemo((): Investment[] => {
    let filtered: Investment[] = records

    if (filterStatus === 'ACTIVE') {
      filtered = records.filter((item: Investment): boolean => {
        const startDate: Date = getStartDate(item)
        return !isCompleted(startDate, item.period_years)
      })
    } else if (filterStatus === 'ENDED') {
      filtered = records.filter((item: Investment): boolean => {
        const startDate: Date = getStartDate(item)
        return isCompleted(startDate, item.period_years)
      })
    }

    const sorted: Investment[] = [...filtered].sort((a: Investment, b: Investment): number => {
      if (sortBy === 'TOTAL_VALUE') {
        // 누적 납입 원금(월 납입액 × 경과 개월) 기준 정렬
        const paidA: number = a.monthly_amount * Math.max(0, getElapsedMonths(getStartDate(a)))
        const paidB: number = b.monthly_amount * Math.max(0, getElapsedMonths(getStartDate(b)))
        return paidB - paidA
      }

      if (sortBy === 'MONTHLY_PAYMENT') {
        return b.monthly_amount - a.monthly_amount
      }

      if (sortBy === 'NAME') {
        return a.title.localeCompare(b.title, 'ko')
      }

      if (sortBy === 'NEXT_PAYMENT') {
        const dA: number | null = getDaysUntilNextPayment(a.investment_days)
        const dB: number | null = getDaysUntilNextPayment(b.investment_days)
        if (dA === null && dB === null) return 0
        if (dA === null) return 1
        if (dB === null) return -1
        return dA - dB
      }

      return 0
    })

    return sorted
  }, [records, filterStatus, sortBy])

  return {
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    filteredRecords,
    activeRecords,
    totalMonthlyPayment,
  }
}
