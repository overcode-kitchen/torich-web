import type { Investment } from '@/app/types/investment'
import type { Goal } from '@/app/types/goal'
import type { PaymentHistoryMap } from '@/app/types/payment'
import type { ConsistencyInsight } from '@/app/hooks/chart/useChartData'
import type { PeriodPreset } from '@/app/hooks/stats/usePeriodFilter'
import type { DateRange } from 'react-day-picker'

/**
 * 통계 화면 공용 prop 묶음.
 * page → StatsView → StatsContent → 탭 컴포넌트로 같은 형태가 그대로 내려가므로
 * 화면마다 같은 타입을 다시 선언하지 않도록 여기 한 곳에 둔다.
 */

export interface StatsData {
  records: Investment[]
  activeRecords: Investment[]
  hasRecords: boolean
  /** 활성/완료 목적 — 기본 탭 결정과 목표 탭 빈 상태 판정에 쓴다 */
  goals: Goal[]
}

export interface StatsPayment {
  completedPayments: PaymentHistoryMap
  retroactivePayments: PaymentHistoryMap
}

export interface StatsUI {
  handleShowContribution: () => void
}

export interface StatsCalculations {
  totalPaidPrincipal: number
  totalMonthlyPayment: number
}

/** 기간 필터 — 기록 탭에서만 쓴다(다른 탭에 영향을 주지 않는다는 것을 배치로 드러냄) */
export interface StatsFilter {
  periodPreset: PeriodPreset
  setPeriodPreset: (preset: PeriodPreset) => void
  periodLabel: string
  customDateRange: DateRange | undefined
  setCustomDateRange: (range: DateRange | undefined) => void
  handleCustomPeriod: () => void
}

export interface StatsChart {
  chartData: Array<{ name: string; rate: number; completed: number; total: number }>
  chartBarColor: string
  chartEmphasisColor: string
  consistency: ConsistencyInsight | null
}

export interface StatsContentProps {
  data: StatsData
  payment: StatsPayment
  ui: StatsUI
  calculations: StatsCalculations
  filter: StatsFilter
  chart: StatsChart
}
