'use client'

import { useCallback } from 'react'
import type { Investment } from '@/app/types/investment'
import { toggleMonthPayments } from '@/app/utils/payment-history'
import { toastUndo } from '@/app/utils/toast'
import { paymentToastMessage } from '@/app/utils/payment-toast-message'

/**
 * 상세 '월별 납입 기록' 표에서 그 달 회차를 통째로 토글한 뒤,
 * 앱 공통 '되돌리기' 토스트를 띄운다.
 *
 * - 되돌리기는 방금 바꾼 회차(toggleMonthPayments 반환)만 정확히 원복한다.
 *   되돌릴 대상은 토스트 액션 클로저가 들고 있어 훅에 pending 상태가 필요 없다.
 * - togglePayment는 PaymentHistoryContext의 것을 주입받아 표·홈·통계가 함께 갱신된다.
 */

export interface UseMonthToggleUndoReturn {
  onToggleAuto: (
    item: Investment,
    completedForRecord: Set<string> | undefined,
    yearMonth: string,
    currentCompleted: boolean,
  ) => Promise<void>
}

export function useMonthToggleUndo(
  togglePayment: (recordId: string, date: string, currentCompleted: boolean) => Promise<void>,
): UseMonthToggleUndoReturn {
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
      // 되돌릴 때 각 회차에 넘길 currentCompleted(= 방금 만들어진 상태)
      const undoCurrentCompleted = !currentCompleted
      // 그 달 회차를 통째로 토글하므로 대상은 "몇 월". 어떤 항목인지 이름을 함께 담는다. (이슈 #196)
      toastUndo(
        paymentToastMessage(item.title, `${month}월`, currentCompleted ? 'canceled' : 'completed'),
        () => {
          void (async () => {
            for (const date of toggled) {
              await togglePayment(item.id, date, undoCurrentCompleted)
            }
          })()
        },
      )
    },
    [togglePayment],
  )

  return { onToggleAuto }
}
