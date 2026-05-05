import { Investment } from '@/app/types/investment'

import { PaymentHistoryMap } from '@/app/hooks/payment/usePaymentHistory'

export interface UseInvestmentDataProps {
  item: Investment
  isEditMode: boolean
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
  completedPayments: PaymentHistoryMap
  retroactivePayments?: PaymentHistoryMap
  onToggleRetroactive?: (recordId: string, yearMonth: string, currentCompleted: boolean) => Promise<void>
  onMarkAllRetroactive?: (recordId: string, yearMonths: string[]) => Promise<void>
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
  calculatedFutureValue: number
  totalPrincipal: number
  totalPaidPrincipal: number
  calculatedProfit: number
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
}
