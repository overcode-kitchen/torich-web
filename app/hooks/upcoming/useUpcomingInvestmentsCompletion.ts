import { useState, useCallback, useRef, useEffect } from 'react'
import { usePaymentHistory } from '../payment/usePaymentHistory'
import { toastSuccess } from '@/app/utils/toast'
import { awardToryInvestmentComplete } from '@/app/utils/tory-raising/awardToryInvestmentComplete'

const TOAST_DURATION_MS = 5000

interface PendingUndo {
  investmentId: string
  date: Date
  dayOfMonth: number
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function useUpcomingInvestmentsCompletion() {
  const { togglePayment } = usePaymentHistory()
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUndoRef = useRef<PendingUndo | null>(null)

  pendingUndoRef.current = pendingUndo

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const toggleComplete = useCallback(
    async (investmentId: string, date: Date, dayOfMonth: number) => {
      const dateStr = formatDate(date)
      await togglePayment(investmentId, dateStr, false) // Mark as completed

      const reward = awardToryInvestmentComplete({ paymentDateYMD: dateStr, amount: 10 })
      if (reward.awarded) {
        toastSuccess(`🌰 +${reward.amount} 도토리`)
      }

      setPendingUndo({ investmentId, date, dayOfMonth })
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = setTimeout(() => {
        setPendingUndo(null)
        toastTimeoutRef.current = null
      }, TOAST_DURATION_MS)
    },
    [togglePayment]
  )

  const handleUndo = useCallback(() => {
    const p = pendingUndoRef.current
    if (!p) return

    const dateStr = formatDate(p.date)
    togglePayment(p.investmentId, dateStr, true) // Undo completion -> set to incomplete

    setPendingUndo(null)
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
  }, [togglePayment])

  return {
    pendingUndo,
    toggleComplete,
    handleUndo,
  }
}
