'use client'

import { useNotificationToggle } from '../../notification/useNotificationToggle'
import { useInvestmentDetailEdit } from '../detail/useInvestmentDetailEdit'
import { useInvestmentCalculations } from '../calculations/useInvestmentCalculations'
import { getPaymentHistoryFromStart } from '@/app/utils/payment-history'
import { usePaymentPagination } from '../../payment/usePaymentPagination'
import type { UseInvestmentDataProps, UseInvestmentDataReturn } from '../../types/useInvestmentData'

export function useInvestmentData({
  item,
  isEditMode,
  calculateFutureValue,
  completedPayments,
}: UseInvestmentDataProps): UseInvestmentDataReturn {
  // 알림 훅
  const { notificationOn, toggleNotification } = useNotificationToggle(item.id)

  // 수정 폼 훅
  const editForm = useInvestmentDetailEdit()

  // 계산 훅
  const calculations = useInvestmentCalculations({
    item,
    isEditMode,
    editMonthlyAmount: editForm.editMonthlyAmount,
    editPeriodYears: editForm.editPeriodYears,
    editAnnualRate: editForm.editAnnualRate,
    editInvestmentDays: editForm.editInvestmentDays,
    calculateFutureValue,
  })

  // 납입 기록
  const fullPaymentHistory = getPaymentHistoryFromStart(
    item.id,
    completedPayments,
    item.investment_days ?? undefined,
    item.start_date ?? item.created_at ?? undefined,
    item.period_years
  )

  const { paymentHistory, hasMorePaymentHistory, loadMore } = usePaymentPagination(
    fullPaymentHistory,
    item.id
  )

  return {
    notificationOn,
    toggleNotification,
    ...editForm,
    ...calculations,
    paymentHistory,
    hasMorePaymentHistory,
    loadMore,
  }
}
