'use client'

import { useMemo, useState } from 'react'
import { differenceInMonths } from 'date-fns'
import { calculateSavingsMaturity } from '@/app/utils/savingsMaturity'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import { usePaymentPagination } from '@/app/hooks/payment/usePaymentPagination'
import { getPaymentHistoryFromStart } from '@/app/utils/payment-history'
import { getStartDate } from '@/app/types/investment'
import { calculateEndDate, getElapsedMonths } from '@/app/utils/date'
import type { SavingsMaturityResult } from '@/app/utils/savingsMaturity'
import type { Investment } from '@/app/types/investment'

type PaymentHistoryRow = {
  monthLabel: string
  yearMonth: string
  completed: boolean
  isRetroactive: boolean
}

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
  /** 적립 시작일 (start_date ?? created_at) */
  startDate: Date
  /** 예적금 만기일 (현금이면 null) */
  endDate: Date | null
  /** 시작일 이후 경과 월수 */
  elapsedMonths: number
  /** 예적금: 시작일~만기일 진행률(0~100), 현금이면 null */
  progress: number | null
  /** 만기일 도달 여부 (예적금 only) */
  completed: boolean
  /** 현금=true(habit), 예적금=false(목표형) */
  isHabitMode: boolean
  /** 자동 추적 납입 기록 (페이지네이션 적용) */
  paymentHistory: PaymentHistoryRow[]
  /** 소급 납입 기록 (앱 등록 이전 기간) */
  retroactivePaymentHistory: PaymentHistoryRow[]
  /** 추가 자동 기록이 더 있는지 */
  hasMorePaymentHistory: boolean
  /** 자동 기록 더 불러오기 */
  loadMore: () => void
  /** 소급 기록 한 줄 토글 */
  onToggleRetroactive: (yearMonth: string, currentCompleted: boolean) => void
  /** 소급 기록 일괄 완료 */
  onMarkAllRetroactive: (yearMonths: string[]) => Promise<void>
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
  const {
    completedPayments,
    retroactivePayments,
    toggleRetroactivePayment,
    markAllRetroactivePaid,
  } = usePaymentHistory()

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

  const startDate = useMemo(() => getStartDate(item), [item])
  // 종료 시점: 예적금=만기일, 현금=시작일+목표기간(설정 시), 그 외=무기한(habit)
  const endDate = useMemo<Date | null>(() => {
    if (item.record_type === 'savings' && item.maturity_date) {
      return new Date(item.maturity_date)
    }
    if (item.record_type === 'cash' && item.period_years && item.period_years > 0) {
      return calculateEndDate(startDate, item.period_years)
    }
    return null
  }, [item.record_type, item.maturity_date, item.period_years, startDate])
  const isHabitMode = !endDate
  const elapsedMonths = useMemo(() => Math.max(0, getElapsedMonths(startDate)), [startDate])
  const progress = useMemo<number | null>(() => {
    if (!endDate) return null
    const totalMonths = differenceInMonths(endDate, startDate)
    if (totalMonths <= 0) return 100
    const raw = Math.round((elapsedMonths / totalMonths) * 100)
    return Math.min(100, Math.max(0, raw))
  }, [endDate, startDate, elapsedMonths])
  const completed = endDate ? new Date() >= endDate : false

  // 납입 기록 (자동/소급) — 주식 상세와 동일한 가공 함수 사용
  const fullPaymentHistory = useMemo(
    () =>
      getPaymentHistoryFromStart(
        item.id,
        completedPayments,
        item.investment_days ?? undefined,
        item.start_date ?? item.created_at ?? undefined,
        item.period_years ?? undefined,
        item.created_at ?? undefined,
        retroactivePayments,
      ),
    [
      item.id,
      item.investment_days,
      item.start_date,
      item.created_at,
      item.period_years,
      completedPayments,
      retroactivePayments,
    ],
  )

  const autoPaymentHistory = useMemo(
    () => fullPaymentHistory.filter((entry) => !entry.isRetroactive),
    [fullPaymentHistory],
  )
  const retroactivePaymentHistory = useMemo(
    () => fullPaymentHistory.filter((entry) => entry.isRetroactive),
    [fullPaymentHistory],
  )

  const { paymentHistory, hasMorePaymentHistory, loadMore } = usePaymentPagination(
    autoPaymentHistory,
    item.id,
  )

  const onToggleRetroactive = (yearMonth: string, currentCompleted: boolean) =>
    toggleRetroactivePayment(item.id, yearMonth, currentCompleted)
  const onMarkAllRetroactive = (yearMonths: string[]) =>
    markAllRetroactivePaid(item.id, yearMonths)

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
    startDate,
    endDate,
    elapsedMonths,
    progress,
    completed,
    isHabitMode,
    paymentHistory: paymentHistory as PaymentHistoryRow[],
    retroactivePaymentHistory: retroactivePaymentHistory as PaymentHistoryRow[],
    hasMorePaymentHistory,
    loadMore,
    onToggleRetroactive,
    onMarkAllRetroactive,
  }
}
