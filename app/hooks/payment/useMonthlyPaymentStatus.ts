'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Investment } from '@/app/types/investment'
import { ymd, monthlyInstallmentDays } from '@/app/utils/monthly-installments'
import { hapticSuccess, hapticLightImpact } from '@/app/utils/haptics'
import { usePaymentHistory } from './usePaymentHistory'
import { usePostponedPayments } from './usePostponedPayments'

/**
 * 이번 달 납입 완료 상태(투자별) 판단 + 토글.
 *
 * - 홈 목적 그룹 카드의 적립 항목 행용.
 * - investment_days의 "각 날짜 = 개별 회차"로 다룬다(통계·도토리 보상과 동일 기준).
 *   완료 버튼은 다음 도래(미완료) 회차 하나만 완료 처리하고, 이번 달 completed/total 진행을 노출한다.
 * - 미룸은 종전대로 record-월 단위(통계 분모 제외 기준과 동일).
 * - 완료 시 하단 '되돌리기' 배너(pendingUndo)를 띄워 방금 완료한 회차를 즉시 취소할 수 있게 한다.
 * - 새 DB 로직 없이 usePaymentHistory(togglePayment)를 그대로 재사용한다.
 */

const UNDO_TOAST_DURATION_MS = 5000

/** 이번 달 날짜 집합에서 해당 월에 속한 첫 날짜를 찾는다(미룸 판정용). 없으면 null. */
function dateInMonth(dates: Set<string> | undefined, year: number, month: number): string | null {
  if (!dates) return null
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  for (const d of dates) {
    if (d.startsWith(prefix)) return d
  }
  return null
}

export interface MonthlyRecordStatus {
  /** 이번 달 총 회차 수(= investment_days 개수, 없으면 1) */
  total: number
  /** 완료한 회차 수 */
  completed: number
  /** 다음 완료할 날짜(1~31). 전부 완료면 null */
  nextPendingDay: number | null
  /** 모든 회차 완료 */
  isFullyPaid: boolean
}

/** 완료 직후 되돌리기 배너에 필요한 정보 */
interface PendingUndo {
  recordId: string
  date: string
  label: string
}

export interface MonthlyPaymentStatus {
  /** record -> 이번 달 회차 진행 상태 */
  getStatus: (record: Investment) => MonthlyRecordStatus
  /** recordId -> 이번 달 미룸 여부 */
  isPostponed: (recordId: string) => boolean
  /** 다음 도래 회차 완료(전부 완료 상태면 마지막 회차 취소) */
  toggle: (record: Investment) => Promise<void>
  /** 이번 달 미룸 토글 */
  togglePostpone: (record: Investment) => Promise<void>
  /** 방금 완료한 회차 취소용 배너 정보(없으면 null) */
  pendingUndo: PendingUndo | null
  /** 되돌리기: 방금 완료한 회차를 미완료로 되돌린다 */
  handleUndo: () => Promise<void>
  /** payment_history 로딩 중 여부 */
  isLoading: boolean
}

export function useMonthlyPaymentStatus(): MonthlyPaymentStatus {
  const { completedPayments, isLoading, togglePayment } = usePaymentHistory()
  const { postponedPayments, togglePostpone: togglePostponeRow } = usePostponedPayments()

  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  const { year, month } = useMemo(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }
  }, [])

  const getStatus = useCallback(
    (record: Investment): MonthlyRecordStatus => {
      const days = monthlyInstallmentDays(record.investment_days, year, month)
      const done = completedPayments.get(record.id)
      let completed = 0
      let nextPendingDay: number | null = null
      for (const d of days) {
        if (done?.has(ymd(year, month, d))) completed += 1
        else if (nextPendingDay === null) nextPendingDay = d
      }
      return {
        total: days.length,
        completed,
        nextPendingDay,
        isFullyPaid: completed >= days.length,
      }
    },
    [completedPayments, year, month],
  )

  const postponedDateThisMonth = useCallback(
    (recordId: string): string | null =>
      dateInMonth(postponedPayments.get(recordId), year, month),
    [postponedPayments, year, month],
  )

  const isPostponed = useCallback(
    (recordId: string): boolean => postponedDateThisMonth(recordId) !== null,
    [postponedDateThisMonth],
  )

  const showUndo = useCallback((undo: PendingUndo) => {
    setPendingUndo(undo)
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setPendingUndo(null)
      undoTimerRef.current = null
    }, UNDO_TOAST_DURATION_MS)
  }, [])

  const toggle = useCallback(
    async (record: Investment): Promise<void> => {
      const days = monthlyInstallmentDays(record.investment_days, year, month)
      const status = getStatus(record)
      if (status.isFullyPaid) {
        // 전부 완료 상태에서 탭 = 마지막(가장 늦은) 회차를 취소한다.
        const lastDay = days[days.length - 1]
        await togglePayment(record.id, ymd(year, month, lastDay), true)
        hapticLightImpact()
        return
      }
      // 완료 처리 시 같은 달 미룸 상태가 있으면 함께 해제(완료가 미룸을 무효화).
      const postponed = postponedDateThisMonth(record.id)
      if (postponed) await togglePostponeRow(record.id, postponed, true)
      // 다음 도래 회차 완료. (isFullyPaid=false이므로 nextPendingDay는 non-null이지만 방어적으로 days[0] 폴백)
      const day = status.nextPendingDay ?? days[0]
      const date = ymd(year, month, day)
      await togglePayment(record.id, date, false)
      hapticSuccess()
      // 회차가 여럿이면 어떤 회차를 되돌리는지 명시("10일 완료됨").
      showUndo({ recordId: record.id, date, label: days.length > 1 ? `${day}일 완료됨` : '완료됨' })
    },
    [togglePayment, togglePostponeRow, getStatus, postponedDateThisMonth, showUndo, year, month],
  )

  const handleUndo = useCallback(async (): Promise<void> => {
    if (!pendingUndo) return
    await togglePayment(pendingUndo.recordId, pendingUndo.date, true)
    hapticLightImpact()
    setPendingUndo(null)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
  }, [togglePayment, pendingUndo])

  const togglePostpone = useCallback(
    async (record: Investment): Promise<void> => {
      const existing = postponedDateThisMonth(record.id)
      if (existing) {
        await togglePostponeRow(record.id, existing, true)
      } else {
        // 미룸 기록은 종전과 동일하게 가장 이른 날짜에 남긴다(통계는 record-월 단위로만 참조).
        const day = monthlyInstallmentDays(record.investment_days, year, month)[0]
        await togglePostponeRow(record.id, ymd(year, month, day), false)
      }
    },
    [togglePostponeRow, postponedDateThisMonth, year, month],
  )

  return { getStatus, isPostponed, toggle, togglePostpone, pendingUndo, handleUndo, isLoading }
}
