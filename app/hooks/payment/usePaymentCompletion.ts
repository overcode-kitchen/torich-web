'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { PaymentEvent } from '@/app/utils/stats'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { usePostponedPayments } from './usePostponedPayments'
import { isPaymentCompleted, isPaymentPostponed } from '@/app/utils/payment-completion'
import { toastSuccess } from '@/app/utils/toast'
import { awardToryInvestmentComplete } from '@/app/utils/tory-raising/awardToryInvestmentComplete'
import { hapticSuccess, hapticLightImpact } from '@/app/utils/haptics'

const TOAST_DURATION_MS = 5000

function eventDateStr(e: PaymentEvent): string {
  return `${e.year}-${String(e.month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`
}

export function usePaymentCompletion() {
  const { completedPayments, togglePayment } = usePaymentHistoryContext()
  const { postponedPayments, togglePostpone } = usePostponedPayments()
  const [pendingUndo, setPendingUndo] = useState<PaymentEvent | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 클린업
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const isEventCompleted = useCallback((e: PaymentEvent) => {
    return isPaymentCompleted(completedPayments, e.investmentId, e.year, e.month, e.day)
  }, [completedPayments])

  const isEventPostponed = useCallback((e: PaymentEvent) => {
    return isPaymentPostponed(postponedPayments, e.investmentId, e.year, e.month, e.day)
  }, [postponedPayments])

  const handleComplete = useCallback(async (e: PaymentEvent) => {
    const dateStr = eventDateStr(e)

    // 완료 처리 시 미룸 상태가 있으면 함께 해제(완료가 미룸을 무효화).
    if (isPaymentPostponed(postponedPayments, e.investmentId, e.year, e.month, e.day)) {
      await togglePostpone(e.investmentId, dateStr, true)
    }

    // Toggle to true (currently false)
    await togglePayment(e.investmentId, dateStr, false)

    // 납입 완료 = 되돌리기 어려운 상태 변경 → HIG "Confirm a successful action" 성공 햅틱
    hapticSuccess()

    const reward = awardToryInvestmentComplete({ paymentDateYMD: dateStr, amount: 10 })
    if (reward.awarded) toastSuccess(`🌰 +${reward.amount} 도토리`)

    setPendingUndo(e)

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => {
      setPendingUndo(null)
      toastTimeoutRef.current = null
    }, TOAST_DURATION_MS)
  }, [togglePayment, togglePostpone, postponedPayments])

  // pendingUndo를 ref로 미러링하지 않고 그대로 의존한다. ref 미러링은 렌더 중 쓰기라
  // React Compiler에서 깨지고, 여기서는 얻는 것도 없다 — handleUndo는 onClick으로만 쓰여
  // identity가 바뀌어도 리렌더를 유발하지 않는다. (useMonthlyPaymentStatus.handleUndo와 동일한 형태)
  const handleUndo = useCallback(async () => {
    if (!pendingUndo) return

    const dateStr = eventDateStr(pendingUndo)

    // Toggle to false (currently true)
    await togglePayment(pendingUndo.investmentId, dateStr, true)

    // 완료의 짝(되돌리기) → 저강도 물리 피드백으로 토글 해제를 손끝으로 확인
    hapticLightImpact()

    setPendingUndo(null)

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
  }, [togglePayment, pendingUndo])

  // 이미 완료된 항목의 '완료됨' 표기를 다시 눌렀을 때 미완료로 되돌린다.
  // (홈 토스트의 '되돌리기'와 동일한 토글이되, 토스트 상태와 무관하게 항상 동작)
  const handleUncomplete = useCallback(async (e: PaymentEvent) => {
    await togglePayment(e.investmentId, eventDateStr(e), true)
    hapticLightImpact()
  }, [togglePayment])

  // 미루기: 완료도 미완료도 아닌 "미룸"으로 처리. 행이 미룸 상태로 표시되고
  // 미완료 집계에서 빠진다. 되돌리기는 미룸 상태를 다시 눌러 해제(handleUnpostpone).
  const handlePostpone = useCallback(async (e: PaymentEvent) => {
    await togglePostpone(e.investmentId, eventDateStr(e), false)
    hapticLightImpact()
  }, [togglePostpone])

  const handleUnpostpone = useCallback(async (e: PaymentEvent) => {
    await togglePostpone(e.investmentId, eventDateStr(e), true)
    hapticLightImpact()
  }, [togglePostpone])

  return {
    isEventCompleted,
    isEventPostponed,
    handleComplete,
    handleUncomplete,
    handlePostpone,
    handleUnpostpone,
    handleUndo,
    pendingUndo,
  }
}
