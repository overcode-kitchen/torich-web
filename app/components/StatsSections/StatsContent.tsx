'use client'

import { useMemo } from 'react'
import ExpectedAssetSection from '@/app/components/StatsSections/ExpectedAssetSection'
import AssetGrowthSection from '@/app/components/StatsSections/AssetGrowthSection'
import MonthlyStatusSection from '@/app/components/StatsSections/MonthlyStatusSection'
import CompletionRateSection from '@/app/components/StatsSections/CompletionRateSection'
import ModeBreakdownSection from '@/app/components/StatsSections/ModeBreakdownSection'
import StatsGoalProgressSection from '@/app/components/StatsSections/StatsGoalProgressSection'
import type { Investment } from '@/app/types/investment'
import type {
    GoalStats,
    HabitStats,
} from '@/app/hooks/investment/calculations/useStatsCalculations'
import type { PaymentHistoryMap } from '@/app/hooks/payment/usePaymentHistory'
import { getMonthlyPaymentDelta } from '@/app/utils/stats'
import { useAssetGrowthChart } from '@/app/hooks/chart/useAssetGrowthChart'

interface StatsContentProps {
    data: {
        records: Investment[]
        activeRecords: Investment[]
        hasRecords: boolean
    }
    payment: {
        completedPayments: PaymentHistoryMap
        retroactivePayments: PaymentHistoryMap
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
    payment,
    ui,
    calculations,
    filter,
    chart,
}: StatsContentProps) {
    const { records, activeRecords, hasRecords } = data
    const { completedPayments, retroactivePayments } = payment
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

    const delta = useMemo(
        () => getMonthlyPaymentDelta(activeRecords, completedPayments, retroactivePayments),
        [activeRecords, completedPayments, retroactivePayments]
    )

    // 예상 자산 카드의 원금 대비 수익(+%)을 표시하기 위해 차트 데이터의 최종 시점을 그대로 활용한다.
    const growthChart = useAssetGrowthChart({ investments: records, selectedYear })

    return (
        <>
            <StatsGoalProgressSection records={records} />

            {hasRecords && (
                <ExpectedAssetSection
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    totalExpectedAsset={totalExpectedAsset}
                    hasMaturedInvestments={hasMaturedInvestments}
                    totalMonthlyPayment={totalMonthlyPayment}
                    expectedProfit={growthChart.currentData?.profit}
                    expectedPrincipal={growthChart.currentData?.principal}
                    onShowCashHold={handleShowCashHold}
                    onShowContribution={handleShowContribution}
                />
            )}

            {hasRecords && (
                <AssetGrowthSection
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    records={records}
                />
            )}

            <MonthlyStatusSection thisMonth={thisMonth} delta={delta} />

            {hasRecords && (
                <ModeBreakdownSection goalStats={goalStats} habitStats={habitStats} />
            )}

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
