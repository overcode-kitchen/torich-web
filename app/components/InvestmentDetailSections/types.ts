import { Investment } from '@/app/types/investment'

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
  onToggleRetroactive?: (yearMonth: string, currentCompleted: boolean) => void
  onMarkAllRetroactive?: (yearMonths: string[]) => Promise<void>
}
