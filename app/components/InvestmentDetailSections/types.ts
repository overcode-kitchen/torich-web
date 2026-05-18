import { Investment } from '@/app/types/investment'

export interface InfoSectionProps {
  item: Investment
  isEditMode: boolean

  // 수정 폼 상태
  editMonthlyAmount: string
  editPeriodYears: string
  editAnnualRate: string
  editInvestmentDays: number[]

  // 수정 폼 핸들러
  setEditMonthlyAmount: (value: string) => void
  setEditPeriodYears: (value: string) => void
  setEditAnnualRate: (value: string) => void
  setEditInvestmentDays: React.Dispatch<React.SetStateAction<number[]>>
  setIsDaysPickerOpen: (value: boolean) => void

  handleNumericInput: (value: string, setter: (v: string) => void) => void

  // 계산된 값
  displayAnnualRate: number

  // Ref
  infoRef: React.RefObject<HTMLElement | null>
}

export interface PaymentHistorySectionProps {
  item: Investment
  paymentHistory: Array<{
    monthLabel: string
    yearMonth: string
    completed: boolean
    isRetroactive: boolean
  }>
  retroactivePaymentHistory?: Array<{
    monthLabel: string
    yearMonth: string
    completed: boolean
    isRetroactive: boolean
  }>
  hasMorePaymentHistory: boolean
  loadMore: () => void
  historyRef: React.RefObject<HTMLElement | null>
}
