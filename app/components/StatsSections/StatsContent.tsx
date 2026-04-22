'use client'

import ExpectedAssetSection from '@/app/components/StatsSections/ExpectedAssetSection'
import AssetGrowthSection from '@/app/components/StatsSections/AssetGrowthSection'
import MonthlyStatusSection from '@/app/components/StatsSections/MonthlyStatusSection'
import CompletionRateSection from '@/app/components/StatsSections/CompletionRateSection'
import ModeBreakdownSection from '@/app/components/StatsSections/ModeBreakdownSection'
import type { Investment } from '@/app/types/investment'
import type {
    GoalStats,
    HabitStats,
} from '@/app/hooks/investment/calculations/useStatsCalculations'

interface StatsContentProps {
    data: {
        records: Investment[]
        hasRecords: boolean
    }
    ui: {
        selectedYear: number
        setSelectedYear: (year: number) => void
        handleShowCashHold: () => void
        handleShowContribution: () => void
    }
    calculations: {
        totalExpectedAsset: number
        totalMonthlyPayment: number
        hasMaturedInvestments: boolean
        thisMonth: {
            totalPayment: number
            completedPayment: number
            progress: number
            remainingPayment: number
        }
        goalStats: GoalStats
        habitStats: HabitStats
    }
    filter: {
        periodPreset: string
        setPeriodPreset: (preset: any) => void
        periodLabel: string
        customDateRange: any
        setCustomDateRange: (range: any) => void
        handleCustomPeriod: () => void
    }
    chart: {
        periodCompletionRate: number
        chartData: any[]
        chartBarColor: string
    }
}

export default function StatsContent({
    data,
    ui,
    calculations,
    filter,
    chart,
}: StatsContentProps) {
    const { records, hasRecords } = data
    const { selectedYear, setSelectedYear, handleShowCashHold, handleShowContribution } = ui
    const {
        totalExpectedAsset,
        totalMonthlyPayment,
        hasMaturedInvestments,
        thisMonth,
        goalStats,
        habitStats,
    } = calculations
    const { periodPreset, setPeriodPreset, periodLabel, customDateRange, setCustomDateRange, handleCustomPeriod } = filter
    const { periodCompletionRate, chartData, chartBarColor } = chart

    return (
        <>
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

            {/* 모드별 요약 (목표형/적립형 혼재 시) */}
            {hasRecords && (
                <ModeBreakdownSection goalStats={goalStats} habitStats={habitStats} />
            )}

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
        </>
    )
}
