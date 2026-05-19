'use client'

import { useMemo, useState } from 'react'
import { calculateSavingsMaturity } from '@/app/utils/savingsMaturity'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import type { SavingsMaturityResult } from '@/app/utils/savingsMaturity'
import type { Investment } from '@/app/types/investment'

export interface UseSavingsCashDetailReturn {
  /** 삭제 확인 모달 노출 여부 */
  showDeleteModal: boolean
  setShowDeleteModal: (open: boolean) => void
  /** 삭제 진행 중 여부 */
  isDeleting: boolean
  handleDelete: () => Promise<void>
  /** 예적금 만기 예상 수령액 (현금이거나 계산 불가 시 null) */
  maturity: SavingsMaturityResult | null
  /** 누적 납입 원금 (완료 처리한 달 수 × 매달 금액) */
  totalPaidPrincipal: number
}

/**
 * 예적금·현금 상세 화면 UI 상태 및 만기 수령액 계산 훅.
 */
export function useSavingsCashDetail(
  item: Investment,
  onDelete: () => Promise<void>,
): UseSavingsCashDetailReturn {
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { completedPayments, retroactivePayments } = usePaymentHistory()

  const maturity = useMemo(
    () => (item.record_type === 'savings' ? calculateSavingsMaturity(item) : null),
    [item],
  )

  // 자동·소급 완료 기록을 합산해 납입 횟수를 센다.
  const totalPaidPrincipal = useMemo(() => {
    const auto = completedPayments.get(item.id)?.size ?? 0
    const retro = retroactivePayments.get(item.id)?.size ?? 0
    return (auto + retro) * item.monthly_amount
  }, [completedPayments, retroactivePayments, item.id, item.monthly_amount])

  const handleDelete = async (): Promise<void> => {
    try {
      setIsDeleting(true)
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    handleDelete,
    maturity,
    totalPaidPrincipal,
  }
}
