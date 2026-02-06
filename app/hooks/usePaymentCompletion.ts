'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { PaymentEvent } from '@/app/utils/stats'
import {
  setPaymentCompleted,
  clearPaymentCompleted,
  isPaymentCompleted
} from '@/app/utils/payment-completion'

const TOAST_DURATION_MS = 5000

export function usePaymentCompletion() {
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set())
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
    const key = `${e.investmentId}_${e.year}_${e.month}_${e.day}` 
    if (completedKeys.has(key)) return true
    return isPaymentCompleted(e.investmentId, e.year, e.month, e.day)
  }, [completedKeys])

  const handleComplete = useCallback((e: PaymentEvent) => {
    setPaymentCompleted(e.investmentId, e.year, e.month, e.day)
    const key = `${e.investmentId}_${e.year}_${e.month}_${e.day}` 
    setCompletedKeys((prev) => new Set(prev).add(key))
    setPendingUndo(e)

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => {
      setPendingUndo(null)
      toastTimeoutRef.current = null
    }, TOAST_DURATION_MS)
  }, [])

  const handleUndo = useCallback(() => {
    const p = pendingUndoRef.current
    if (!p) return

    clearPaymentCompleted(p.investmentId, p.year, p.month, p.day)
    const key = `${p.investmentId}_${p.year}_${p.month}_${e.day}` 
    setCompletedKeys((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    setPendingUndo(null)

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
  }, [])

  return {
    isEventCompleted,
    handleComplete,
    handleUndo,
    pendingUndo,
  }
}
