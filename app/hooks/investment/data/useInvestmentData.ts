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
  retroactivePayments,
  onToggleRetroactive,
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
  // - start_date: 진행률/경과 기간 계산 기준 (실제 투자 시작일)
  // - created_at: 앱에서 자동 추적을 시작한 시점 (납입 기록 자동 추적 기준점)
  // - 두 날짜 사이 구간은 "소급 기록" 영역으로 별도 반환된다.
  const fullPaymentHistory = getPaymentHistoryFromStart(
    item.id,
    completedPayments,
    item.investment_days ?? undefined,
    item.start_date ?? item.created_at ?? undefined,
    item.period_years,
    item.created_at ?? undefined,
    retroactivePayments
  )

  const autoPaymentHistory = fullPaymentHistory.filter((entry) => !entry.isRetroactive)
  const retroactivePaymentHistory = fullPaymentHistory.filter((entry) => entry.isRetroactive)

  const { paymentHistory, hasMorePaymentHistory, loadMore } = usePaymentPagination(
    autoPaymentHistory,
    item.id
  )

  const handleToggleRetroactive = onToggleRetroactive
    ? (yearMonth: string, currentCompleted: boolean) =>
        onToggleRetroactive(item.id, yearMonth, currentCompleted)
    : undefined

  return {
    notificationOn,
    toggleNotification,
    ...editForm,
    ...calculations,
    paymentHistory,
    retroactivePaymentHistory,
    hasMorePaymentHistory,
    loadMore,
    onToggleRetroactive: handleToggleRetroactive,
  }
}
