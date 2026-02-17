'use client'

import { useCallback } from 'react'
import { Investment } from '@/app/types/investment'
import { useInvestmentData } from './useInvestmentData'
import { useInvestmentActions } from './useInvestmentActions'

import { PaymentHistoryMap } from '@/app/hooks/usePaymentHistory'

interface UseInvestmentDetailHandlersProps {
  item: Investment
  onUpdate: (data: { monthly_amount: number; period_years: number; annual_rate: number; investment_days?: number[] }) => Promise<void>
  onDelete: () => Promise<void>
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
  isEditMode: boolean
  setIsEditMode: (value: boolean) => void
  setIsDaysPickerOpen: (value: boolean) => void
  completedPayments: PaymentHistoryMap
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
}: UseInvestmentDetailHandlersProps) {
  // 데이터 훅
  const investmentData = useInvestmentData({
    item,
    isEditMode,
    calculateFutureValue,
    completedPayments,
  })

  // API 액션 훅
  const { isDeleting, isUpdating, handleUpdate, handleDelete } = useInvestmentActions({
    onUpdate,
    onDelete,
  })

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    const monthlyAmountInWon = parseInt(investmentData.editMonthlyAmount.replace(/,/g, '') || '0') * 10000
    const periodYears = parseInt(investmentData.editPeriodYears || '0')
    const annualRate = parseFloat(investmentData.editAnnualRate || '0')

    if (monthlyAmountInWon <= 0 || periodYears <= 0 || annualRate <= 0) {
      alert('모든 값을 올바르게 입력해주세요.')
      return
    }

    try {
      await handleUpdate({
        monthly_amount: monthlyAmountInWon,
        period_years: periodYears,
        annual_rate: annualRate,
        investment_days: investmentData.editInvestmentDays.length > 0 ? investmentData.editInvestmentDays : undefined,
      })
      setIsEditMode(false)
    } catch (error: any) {
      console.error('Failed to update investment:', error)
      alert(`투자 정보 수정 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`)
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
