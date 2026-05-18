'use client'

import { useMemo } from 'react'
import ExpectedAssetSection from '@/app/components/StatsSections/ExpectedAssetSection'
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
        handleShowContribution: () => void
    }
    calculations: {
        totalPaidPrincipal: number
        totalMonthlyPayment: number
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
    const { handleShowContribution } = ui
    const {
        totalPaidPrincipal,
        totalMonthlyPayment,
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

    return (
        <>
            <StatsGoalProgressSection records={records} />

            {hasRecords && (
                <ExpectedAssetSection
                    totalPaidPrincipal={totalPaidPrincipal}
                    totalMonthlyPayment={totalMonthlyPayment}
                    onShowContribution={handleShowContribution}
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
