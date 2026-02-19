'use client'

import { useStatsData } from '@/app/hooks/investment/data/useStatsData'
import { usePeriodFilter } from '@/app/hooks/stats/usePeriodFilter'
import { useStatsCalculations } from '@/app/hooks/investment/calculations/useStatsCalculations'
import { useChartData } from '@/app/hooks/chart/useChartData'
import { useStatsPageUI } from '@/app/hooks/stats/useStatsPageUI'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import StatsView from '@/app/components/StatsSections/StatsView'

export default function StatsPage() {
  const { user, records, activeRecords, isLoading, router } = useStatsData()
  const { completedPayments, isLoading: historyLoading } = usePaymentHistory()

  const {
    selectedYear,
    showCashHoldSheet,
    showContributionSheet,
    hasRecords,
    setSelectedYear,
    handleShowCashHold,
    handleCloseCashHold,
    handleShowContribution,
    handleCloseContribution,
  } = useStatsPageUI({ recordsLength: records.length })

  const {
    periodPreset,
    setPeriodPreset,
    customDateRange,
    setCustomDateRange,
    isCustomRange,
    effectiveMonths,
    periodLabel,
    handleCustomPeriod,
  } = usePeriodFilter()

  const {
    totalExpectedAsset,
    totalMonthlyPayment,
    hasMaturedInvestments,
    maturedItems,
    thisMonth,
    calculateFutureValue,
  } = useStatsCalculations({ records, activeRecords, completedPayments, selectedYear })

  const {
    monthlyRates,
    periodCompletionRate,
    chartData,
    chartBarColor,
  } = useChartData({ activeRecords, completedPayments, isCustomRange, effectiveMonths, customDateRange })

  if (!isLoading && !user) {
    router.replace('/login')
    return null
  }

  return (
    <StatsView
      isLoading={isLoading || historyLoading}
      user={user}
      data={{
        records,
        hasRecords,
      }}
      ui={{
        selectedYear,
        setSelectedYear,
        showCashHoldSheet,
        handleCloseCashHold,
        showContributionSheet,
        handleCloseContribution,
        handleShowCashHold,
        handleShowContribution,
      }}
      filter={{
        periodPreset,
        setPeriodPreset,
        periodLabel,
        customDateRange,
        setCustomDateRange,
        handleCustomPeriod,
      }}
      calculations={{
        totalExpectedAsset,
        totalMonthlyPayment,
        hasMaturedInvestments,
        maturedItems,
        thisMonth,
        calculateFutureValue,
      }}
      chart={{
        periodCompletionRate,
        chartData,
        chartBarColor,
      }}
    />
  )
}
