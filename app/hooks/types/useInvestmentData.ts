import { Investment } from '@/app/types/investment'

import type { PaymentHistoryMap } from '@/app/types/payment'

export interface UseInvestmentDataProps {
  item: Investment
  isEditMode: boolean
  completedPayments: PaymentHistoryMap
  retroactivePayments?: PaymentHistoryMap
  onToggleRetroactive?: (recordId: string, yearMonth: string, currentCompleted: boolean) => Promise<void>
  onMarkAllRetroactive?: (recordId: string, yearMonths: string[]) => Promise<void>
  onToggleAuto?: (recordId: string, yearMonth: string, currentCompleted: boolean) => Promise<void>
}

export interface UseInvestmentDataReturn {
  // 알림
  notificationOn: boolean
  toggleNotification: () => void

  // 수정 폼
  editMonthlyAmount: string
  setEditMonthlyAmount: (value: string) => void
  editPeriodYears: string
  setEditPeriodYears: (value: string) => void
  editAnnualRate: string
  setEditAnnualRate: (value: string) => void
  editInvestmentDays: number[]
  setEditInvestmentDays: (days: number[] | ((prev: number[]) => number[])) => void
  editIsHabitMode: boolean
  setEditIsHabitMode: (habit: boolean) => void
  isRateManuallyEdited: boolean
  setIsRateManuallyEdited: (edited: boolean) => void
  handleNumericInput: (value: string, setter: (v: string) => void) => void
  handleRateInput: (value: string) => void
  initializeFromItem: (item: Investment) => void

  // 계산된 값
  startDate: Date
  displayMonthlyAmount: number
  displayPeriodYears: number | null
  displayAnnualRate: number
  endDate: Date | null
  totalPaidPrincipal: number
  progress: number | null
  completed: boolean
  isHabitMode: boolean
  elapsedMonths: number
  nextPaymentDate: Date | null

  // 납입 기록 (자동 추적: created_at 이후)
  paymentHistory: Array<{ monthLabel: string; yearMonth: string; completed: boolean; isRetroactive: boolean }>
  // 소급 기록 (start_date ~ created_at 사이, 최신순)
  retroactivePaymentHistory: Array<{ monthLabel: string; yearMonth: string; completed: boolean; isRetroactive: boolean }>
  hasMorePaymentHistory: boolean
  loadMore: () => void

  // 소급 토글 (stage 3)
  onToggleRetroactive?: (yearMonth: string, currentCompleted: boolean) => void
  // 소급 일괄 완료 처리 (미기록 월 모두)
  onMarkAllRetroactive?: (yearMonths: string[]) => Promise<void>
  // 자동 기록 한 줄(그 달 회차 전체) 토글 → 상세에서 완료 되돌리기
  onToggleAuto?: (yearMonth: string, currentCompleted: boolean) => void
}
