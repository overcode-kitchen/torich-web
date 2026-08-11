'use client'

import { Investment } from '@/app/types/investment'
import { useInvestmentData } from '../data/useInvestmentData'
import { useInvestmentActions } from '../../ui/useInvestmentActions'
import type { PaymentHistoryMap } from '@/app/types/payment'

interface UseInvestmentDetailHandlersProps {
  item: Investment
  onDelete: () => Promise<void>
  completedPayments: PaymentHistoryMap
  retroactivePayments?: PaymentHistoryMap
  onToggleRetroactive?: (recordId: string, yearMonth: string, currentCompleted: boolean) => Promise<void>
  onMarkAllRetroactive?: (recordId: string, yearMonths: string[]) => Promise<void>
  onToggleAuto?: (recordId: string, yearMonth: string, currentCompleted: boolean) => Promise<void>
}

export function useInvestmentDetailHandlers({
  item,
  onDelete,
  completedPayments,
  retroactivePayments,
  onToggleRetroactive,
  onMarkAllRetroactive,
  onToggleAuto,
}: UseInvestmentDetailHandlersProps) {
  // 데이터 훅
  const investmentData = useInvestmentData({
    item,
    completedPayments,
    retroactivePayments,
    onToggleRetroactive,
    onMarkAllRetroactive,
    onToggleAuto,
  })

  // API 액션 훅
  const { isDeleting, handleDelete } = useInvestmentActions({
    onDelete,
  })

  return {
    investmentData,
    isDeleting,
    handleDelete,
  }
}
