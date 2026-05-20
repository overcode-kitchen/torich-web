'use client'

import { useCallback, useMemo } from 'react'
import type { Investment } from '@/app/types/investment'
import { usePaymentHistory } from './usePaymentHistory'

/**
 * 이번 달 납입 완료 상태(투자별) 판단 + 토글.
 *
 * - 홈 목적 그룹 카드의 적립 항목 행 체크박스용.
 * - 새 DB 로직을 만들지 않고 usePaymentHistory(togglePayment)를 그대로 재사용한다.
 * - 한 투자의 investment_days 중 이번 달 가장 빠른 날을 "이번 달 납입일"로 삼아
 *   payment_history(auto) 기록 유무로 완료 여부를 판단한다.
 * - investment_days가 없으면 매월 1일을 캐논컬 납입일로 사용한다.
 */

/** 이번 달 캐논컬 납입일을 YYYY-MM-DD 문자열로 반환 */
function monthlyPaymentDateStr(record: Investment, year: number, month: number): string {
  const days = record.investment_days
  const day = days && days.length > 0 ? Math.min(...days) : 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export interface MonthlyPaymentStatus {
  /** recordId -> 이번 달 납입 완료 여부 */
  isCompleted: (recordId: string) => boolean
  /** 이번 달 납입 완료 토글 */
  toggle: (record: Investment) => Promise<void>
  /** payment_history 로딩 중 여부 */
  isLoading: boolean
}

export function useMonthlyPaymentStatus(): MonthlyPaymentStatus {
  const { completedPayments, isLoading, togglePayment } = usePaymentHistory()

  const { year, month } = useMemo(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }, [])

  /** 이번 달에 기록된 납입일(YYYY-MM-DD)을 찾는다. 없으면 null. */
  const completedDateThisMonth = useCallback(
    (recordId: string): string | null => {
      const dates = completedPayments.get(recordId)
      if (!dates) return null
      const prefix = `${year}-${String(month).padStart(2, '0')}-`
      for (const d of dates) {
        if (d.startsWith(prefix)) return d
      }
      return null
    },
    [completedPayments, year, month],
  )

  const isCompleted = useCallback(
    (recordId: string): boolean => completedDateThisMonth(recordId) !== null,
    [completedDateThisMonth],
  )

  const toggle = useCallback(
    async (record: Investment): Promise<void> => {
      const existing = completedDateThisMonth(record.id)
      if (existing) {
        // 이미 기록된 행을 그대로 지워야 DELETE가 맞아떨어진다.
        await togglePayment(record.id, existing, true)
      } else {
        await togglePayment(record.id, monthlyPaymentDateStr(record, year, month), false)
      }
    },
    [togglePayment, completedDateThisMonth, year, month],
  )

  return { isCompleted, toggle, isLoading }
}
