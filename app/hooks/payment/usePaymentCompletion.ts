'use client'

import { useCallback } from 'react'
import { PaymentEvent } from '@/app/utils/stats'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { usePostponedPayments } from './usePostponedPayments'
import { isPaymentCompleted, isPaymentPostponed } from '@/app/utils/payment-completion'
import { toastSuccess, toastUndo } from '@/app/utils/toast'
import { awardToryInvestmentComplete } from '@/app/utils/tory-raising/awardToryInvestmentComplete'
import { hapticSuccess, hapticLightImpact } from '@/app/utils/haptics'

function eventDateStr(e: PaymentEvent): string {
  return `${e.year}-${String(e.month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`
}

export function usePaymentCompletion() {
  const { completedPayments, togglePayment } = usePaymentHistoryContext()
  const { postponedPayments, togglePostpone } = usePostponedPayments()

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

    // 되돌릴 회차는 토스트 액션 클로저가 들고 있다 — pending 상태·타이머가 따로 필요 없다.
    toastUndo('완료됨', () => {
      void (async () => {
        // Toggle to false (currently true)
        await togglePayment(e.investmentId, dateStr, true)
        // 완료의 짝(되돌리기) → 저강도 물리 피드백으로 토글 해제를 손끝으로 확인
        hapticLightImpact()
      })()
    })
  }, [togglePayment, togglePostpone, postponedPayments])

  // 이미 완료된 항목의 '완료됨' 표기를 다시 눌렀을 때 미완료로 되돌린다.
  // (토스트의 '되돌리기'와 동일한 토글이되, 토스트가 떠 있는지와 무관하게 항상 동작)
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
  }
}
