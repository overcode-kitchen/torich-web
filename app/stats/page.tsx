'use client'

import { useStatsData } from '@/app/hooks/useStatsData'
import { usePeriodFilter } from '@/app/hooks/usePeriodFilter'
import { useStatsCalculations } from '@/app/hooks/useStatsCalculations'
import { useChartData } from '@/app/hooks/useChartData'
import { useStatsPageUI } from '@/app/hooks/useStatsPageUI'
import StatsView from '@/app/components/StatsView'

export default function StatsPage() {
  const { user, records, activeRecords, isLoading, router } = useStatsData()

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
    thisMonth,
    calculateFutureValue,
  } = useStatsCalculations({ records, activeRecords, selectedYear })

  const {
    monthlyRates,
    periodCompletionRate,
    chartData,
    chartBarColor,
  } = useChartData({ activeRecords, isCustomRange, effectiveMonths, customDateRange })

  if (!isLoading && !user) {
    router.replace('/login')
    return null
  }

  return (
    <StatsView
      isLoading={isLoading}
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
