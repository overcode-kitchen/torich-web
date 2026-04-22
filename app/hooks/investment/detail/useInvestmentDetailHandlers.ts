'use client'

import { useCallback } from 'react'
import { Investment } from '@/app/types/investment'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { useInvestmentData } from '../data/useInvestmentData'
import { useInvestmentActions } from '../../ui/useInvestmentActions'
import { PaymentHistoryMap } from '../../payment/usePaymentHistory'

interface UseInvestmentDetailHandlersProps {
  item: Investment
  onUpdate: (data: { monthly_amount: number; period_years: number | null; annual_rate: number; investment_days?: number[] }) => Promise<void>
  onDelete: () => Promise<void>
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
  isEditMode: boolean
  setIsEditMode: (value: boolean) => void
  setIsDaysPickerOpen: (value: boolean) => void
  completedPayments: PaymentHistoryMap
  retroactivePayments?: PaymentHistoryMap
  onToggleRetroactive?: (recordId: string, yearMonth: string, currentCompleted: boolean) => Promise<void>
}

export function useInvestmentDetailHandlers({
  item,
  onUpdate,
  onDelete,
  calculateFutureValue,
  isEditMode,
  setIsEditMode,
  setIsDaysPickerOpen,
  completedPayments,
  retroactivePayments,
  onToggleRetroactive,
}: UseInvestmentDetailHandlersProps) {
  // 데이터 훅
  const investmentData = useInvestmentData({
    item,
    isEditMode,
    calculateFutureValue,
    completedPayments,
    retroactivePayments,
    onToggleRetroactive,
  })

  // API 액션 훅
  const { isDeleting, isUpdating, handleUpdate, handleDelete } = useInvestmentActions({
    onUpdate,
    onDelete,
  })

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    const monthlyAmountInWon = parseInt(investmentData.editMonthlyAmount.replace(/,/g, '') || '0') * 10000
    const parsedPeriod = parseInt(investmentData.editPeriodYears || '0')
    const annualRate = parseFloat(investmentData.editAnnualRate || '0')
    const isHabit = investmentData.editIsHabitMode

    // 적립형: period_years = null, 목표형: >0 정수 필수
    const periodYearsToSave: number | null = isHabit ? null : parsedPeriod

    if (monthlyAmountInWon <= 0 || annualRate <= 0) {
      alert('모든 값을 올바르게 입력해주세요.')
      return
    }
    if (!isHabit && parsedPeriod <= 0) {
      alert('목표 기간을 입력하거나 "목표 기간 없이 적립하기"를 선택해주세요.')
      return
    }

    try {
      await handleUpdate({
        monthly_amount: monthlyAmountInWon,
        period_years: periodYearsToSave,
        annual_rate: annualRate,
        investment_days: investmentData.editInvestmentDays.length > 0 ? investmentData.editInvestmentDays : undefined,
      })
      setIsEditMode(false)
    } catch {
      toastError(TOAST_MESSAGES.updateSaveFailed)
    }
  }, [investmentData, handleUpdate, setIsEditMode])

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    setIsEditMode(false)
  }, [setIsEditMode])

  // 수정 모드 진입
  const handleEdit = useCallback(() => {
    setIsEditMode(true)
  }, [setIsEditMode])

  // 삭제 모달 열기
  const handleDeleteClick = useCallback(() => {
    // 이 핸들러는 UI 상태를 직접 제어하지 않고, 콜백 함수로 반환
    return true // 모달을 열어야 함을 나타내는 신호
  }, [])

  return {
    investmentData,
    isDeleting,
    isUpdating,
    handleSave,
    handleCancel,
    handleEdit,
    handleDeleteClick,
    handleDelete,
  }
}
