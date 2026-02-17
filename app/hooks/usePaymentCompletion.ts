'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { PaymentEvent } from '@/app/utils/stats'
import { usePaymentHistory } from '@/app/hooks/usePaymentHistory'
import { isPaymentCompleted } from '@/app/utils/payment-completion'

const TOAST_DURATION_MS = 5000

export function usePaymentCompletion() {
  const { completedPayments, togglePayment } = usePaymentHistory()
  const [pendingUndo, setPendingUndo] = useState<PaymentEvent | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUndoRef = useRef<PaymentEvent | null>(null)

  pendingUndoRef.current = pendingUndo

  // 클린업
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const isEventCompleted = useCallback((e: PaymentEvent) => {
    return isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)
  }, [completedPayments])

  const handleComplete = useCallback(async (e: PaymentEvent) => {
    const dateStr = `${e.year}-${String(e.month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`

    // Toggle to true (currently false)
    await togglePayment(e.investmentId, dateStr, false)

    setPendingUndo(e)

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => {
      setPendingUndo(null)
      toastTimeoutRef.current = null
    }, TOAST_DURATION_MS)
  }, [togglePayment])

  const handleUndo = useCallback(async () => {
    const p = pendingUndoRef.current
    if (!p) return

    const dateStr = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`

    // Toggle to false (currently true)
    await togglePayment(p.investmentId, dateStr, true)

    setPendingUndo(null)

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
  }, [togglePayment])

  return {
    isEventCompleted,
    handleComplete,
    handleUndo,
    pendingUndo,
  }
}
