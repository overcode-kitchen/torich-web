'use client'

import { CircleNotch } from '@phosphor-icons/react'
import ExpectedAssetSection from '@/app/components/StatsSections/ExpectedAssetSection'
import AssetGrowthSection from '@/app/components/StatsSections/AssetGrowthSection'
import MonthlyStatusSection from '@/app/components/StatsSections/MonthlyStatusSection'
import CompletionRateSection from '@/app/components/StatsSections/CompletionRateSection'
import CashHoldItemsSheet from '@/app/components/CashHoldItemsSheet'
import MonthlyContributionSheet from '@/app/components/MonthlyContributionSheet'
import type { UseStatsDataReturn } from '@/app/hooks/useStatsData'
import type { UsePeriodFilterReturn } from '@/app/hooks/usePeriodFilter'
import type { UseStatsCalculationsReturn } from '@/app/hooks/useStatsCalculations'
import type { UseChartDataReturn } from '@/app/hooks/useChartData'
import type { UseStatsPageUIReturn } from '@/app/hooks/useStatsPageUI'
import type { Investment } from '@/app/types/investment'

// Hook에서 export되지 않은 타입들 정의
// 실제로는 Hook 파일에서 export해서 사용하는 것이 좋음
interface StatsViewProps {
    isLoading: boolean
    user: { id: string; email?: string } | null

    // Data
    records: Investment[]

    // UI State & Handlers
    selectedYear: number
    setSelectedYear: (year: number) => void
    showCashHoldSheet: boolean
    handleCloseCashHold: () => void
    showContributionSheet: boolean
    handleCloseContribution: () => void
    hasRecords: boolean
    handleShowCashHold: () => void
    handleShowContribution: () => void

    // Period Filter
    periodPreset: string
    setPeriodPreset: (preset: any) => void
    periodLabel: string
    customDateRange: any
    setCustomDateRange: (range: any) => void
    handleCustomPeriod: () => void

    // Calculations
    totalExpectedAsset: number
    totalMonthlyPayment: number
    hasMaturedInvestments: boolean
    thisMonth: {
        totalPayment: number
        completedPayment: number
        progress: number
        remainingPayment: number
    }
    calculateFutureValue: (monthlyAmount: number, T: number, P: number, R?: number) => number

    // Chart Data
    periodCompletionRate: number
    chartData: any[]
    chartBarColor: string
}

export default function StatsView({
    isLoading,
    user,
    records,
    selectedYear,
    setSelectedYear,
    showCashHoldSheet,
    handleCloseCashHold,
    showContributionSheet,
    handleCloseContribution,
    hasRecords,
    handleShowCashHold,
    handleShowContribution,
    periodPreset,
    setPeriodPreset,
    periodLabel,
    customDateRange,
    setCustomDateRange,
    handleCustomPeriod,
    totalExpectedAsset,
    totalMonthlyPayment,
    hasMaturedInvestments,
    thisMonth,
    calculateFutureValue,
    periodCompletionRate,
    chartData,
    chartBarColor,
}: StatsViewProps) {
    if (isLoading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" />
            </main>
        )
    }

    if (!user) {
        return null
    }

    return (
        <main className="min-h-screen bg-surface">
            <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-6 pb-24">
                <h1 className="text-xl font-bold text-foreground mb-6">통계</h1>

                {/* 예상 자산 */}
                {hasRecords && (
                    <ExpectedAssetSection
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        totalExpectedAsset={totalExpectedAsset}
                        hasMaturedInvestments={hasMaturedInvestments}
                        totalMonthlyPayment={totalMonthlyPayment}
                        onShowCashHold={handleShowCashHold}
                        onShowContribution={handleShowContribution}
                    />
                )}

                {/* 예상 수익 차트 */}
                {hasRecords && (
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
                    periodPreset={periodPreset as any}
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
                    onClose={handleCloseCashHold}
                    calculateFutureValue={calculateFutureValue}
                />
            )}

            {showContributionSheet && (
                <MonthlyContributionSheet
                    items={records}
                    totalAmount={totalMonthlyPayment}
                    onClose={handleCloseContribution}
                />
            )}
        </main>
    )
}
