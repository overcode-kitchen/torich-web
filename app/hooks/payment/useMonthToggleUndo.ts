'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Investment } from '@/app/types/investment'
import { toggleMonthPayments } from '@/app/utils/payment-history'

/**
 * 상세 '월별 납입 기록' 표에서 그 달 회차를 통째로 토글한 뒤,
 * 홈과 동일한 하단 '되돌리기' 토스트(UndoToastSection)를 띄운다.
 *
 * - 상단 sonner 토스트 대신 홈/캘린더와 같은 하단 배너로 통일한다.
 * - 되돌리기는 방금 바꾼 회차(toggleMonthPayments 반환)만 정확히 원복한다.
 * - togglePayment는 화면의 usePaymentHistory 인스턴스를 그대로 주입받아 표가 즉시 갱신된다.
 */

const UNDO_TOAST_DURATION_MS = 5000

interface PendingMonthUndo {
  recordId: string
  /** 방금 상태를 바꾼 회차 날짜들 */
  dates: string[]
  /** 되돌릴 때 각 회차에 넘길 currentCompleted(= 방금 만들어진 상태) */
  undoCurrentCompleted: boolean
  /** 하단 토스트 좌측 문구 */
  label: string
}

export interface UseMonthToggleUndoReturn {
  onToggleAuto: (
    item: Investment,
    completedForRecord: Set<string> | undefined,
    yearMonth: string,
    currentCompleted: boolean,
  ) => Promise<void>
  /** 하단 토스트 노출 여부 */
  pendingUndo: boolean
  /** 토스트 좌측 문구(없으면 undefined) */
  undoLabel: string | undefined
  handleUndo: () => Promise<void>
}

export function useMonthToggleUndo(
  togglePayment: (recordId: string, date: string, currentCompleted: boolean) => Promise<void>,
): UseMonthToggleUndoReturn {
  const [pending, setPending] = useState<PendingMonthUndo | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const show = useCallback((u: PendingMonthUndo) => {
    setPending(u)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setPending(null)
      timerRef.current = null
    }, UNDO_TOAST_DURATION_MS)
  }, [])

  const onToggleAuto = useCallback(
    async (
      item: Investment,
      completedForRecord: Set<string> | undefined,
      yearMonth: string,
      currentCompleted: boolean,
    ): Promise<void> => {
      const toggled = await toggleMonthPayments(
        togglePayment,
        completedForRecord,
        item,
        yearMonth,
        currentCompleted,
      )
      if (toggled.length === 0) return
      const month = parseInt(yearMonth.split('-')[1], 10)
      show({
        recordId: item.id,
        dates: toggled,
        undoCurrentCompleted: !currentCompleted,
        label: currentCompleted ? `${month}월 적립 취소됨` : `${month}월 적립 완료됨`,
      })
    },
    [togglePayment, show],
  )

  const handleUndo = useCallback(async (): Promise<void> => {
    if (!pending) return
    for (const date of pending.dates) {
      await togglePayment(pending.recordId, date, pending.undoCurrentCompleted)
    }
    setPending(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [pending, togglePayment])

  return {
    onToggleAuto,
    pendingUndo: !!pending,
    undoLabel: pending?.label,
    handleUndo,
  }
}
