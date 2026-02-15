import { Investment } from '@/app/types/investment'
import { RateSuggestion } from '@/app/components/InvestmentEditSections/InvestmentEditSheet'

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
  handleRateInput: (value: string) => void

  // 계산된 값
  displayAnnualRate: number
  totalPrincipal: number
  calculatedProfit: number
  calculatedFutureValue: number

  // 수익률 관련
  originalRate: number
  isRateManuallyEdited: boolean
  setIsRateManuallyEdited: (value: boolean) => void
  formatRate: (rate: number) => string
  rateSuggestions: RateSuggestion[]
  isCustomRate: boolean

  // Ref
  infoRef: React.RefObject<HTMLElement | null>
}

export interface PaymentHistorySectionProps {
  item: Investment
  paymentHistory: Array<{
    monthLabel: string
    yearMonth: string
    completed: boolean
  }>
  hasMorePaymentHistory: boolean
  loadMore: () => void
  historyRef: React.RefObject<HTMLElement | null>
}
