'use client'

import { useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { useStatsData } from '@/app/hooks/useStatsData'
import { usePeriodFilter } from '@/app/hooks/usePeriodFilter'
import { useStatsCalculations } from '@/app/hooks/useStatsCalculations'
import { useChartData } from '@/app/hooks/useChartData'
import ExpectedAssetSection from '@/app/components/StatsSections/ExpectedAssetSection'
import AssetGrowthSection from '@/app/components/StatsSections/AssetGrowthSection'
import MonthlyStatusSection from '@/app/components/StatsSections/MonthlyStatusSection'
import CompletionRateSection from '@/app/components/StatsSections/CompletionRateSection'
import CashHoldItemsSheet from '@/app/components/CashHoldItemsSheet'
import MonthlyContributionSheet from '@/app/components/MonthlyContributionSheet'


export default function StatsPage() {
  const { user, records, activeRecords, isLoading, router } = useStatsData()
  const [selectedYear, setSelectedYear] = useState(5)
  const [showCashHoldSheet, setShowCashHoldSheet] = useState(false)
  const [showContributionSheet, setShowContributionSheet] = useState(false)

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-6">통계</h1>

        {/* 예상 자산 */}
        {records.length > 0 && (
          <ExpectedAssetSection
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            totalExpectedAsset={totalExpectedAsset}
            hasMaturedInvestments={hasMaturedInvestments}
            totalMonthlyPayment={totalMonthlyPayment}
            onShowCashHold={() => setShowCashHoldSheet(true)}
            onShowContribution={() => setShowContributionSheet(true)}
          />
        )}

        {/* 예상 수익 차트 */}
        {records.length > 0 && (
          <AssetGrowthSection
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            records={records}
          />
        )}

        {/* 이번 달 현황 */}
        <MonthlyStatusSection thisMonth={thisMonth} />

        {/* 기간별 완료율 */}
        <CompletionRateSection
          periodPreset={periodPreset}
          setPeriodPreset={setPeriodPreset}
          periodLabel={periodLabel}
          customDateRange={customDateRange}
          setCustomDateRange={setCustomDateRange}
          handleCustomPeriod={handleCustomPeriod}
          periodCompletionRate={periodCompletionRate}
          chartData={chartData}
          chartBarColor={chartBarColor}
        />

      </div>

      {showCashHoldSheet && (
        <CashHoldItemsSheet
          items={records}
          selectedYear={selectedYear}
          onClose={() => setShowCashHoldSheet(false)}
          calculateFutureValue={calculateFutureValue}
        />
      )}

      {showContributionSheet && (
        <MonthlyContributionSheet
          items={records}
          totalAmount={totalMonthlyPayment}
          onClose={() => setShowContributionSheet(false)}
        />
      )}
    </main>
  )
}
