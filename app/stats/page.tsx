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
      records={records}
      selectedYear={selectedYear}
      setSelectedYear={setSelectedYear}
      showCashHoldSheet={showCashHoldSheet}
      handleCloseCashHold={handleCloseCashHold}
      showContributionSheet={showContributionSheet}
      handleCloseContribution={handleCloseContribution}
      hasRecords={hasRecords}
      handleShowCashHold={handleShowCashHold}
      handleShowContribution={handleShowContribution}
      periodPreset={periodPreset}
      setPeriodPreset={setPeriodPreset}
      periodLabel={periodLabel}
      customDateRange={customDateRange}
      setCustomDateRange={setCustomDateRange}
      handleCustomPeriod={handleCustomPeriod}
      totalExpectedAsset={totalExpectedAsset}
      totalMonthlyPayment={totalMonthlyPayment}
      hasMaturedInvestments={hasMaturedInvestments}
      thisMonth={thisMonth}
      calculateFutureValue={calculateFutureValue}
      periodCompletionRate={periodCompletionRate}
      chartData={chartData}
      chartBarColor={chartBarColor}
    />
  )
}
