'use client'

import { CircleNotch } from '@phosphor-icons/react'
import CashHoldItemsSheet from '@/app/components/CashHoldItemsSheet'
import MonthlyContributionSheet from '@/app/components/MonthlyContributionSheet'
import type { Investment } from '@/app/types/investment'
import { useMonthlyContribution } from '@/app/hooks/useMonthlyContribution'
import StatsHeader from '@/app/components/StatsSections/StatsHeader'
import StatsContent from '@/app/components/StatsSections/StatsContent'

import { CashHoldItemVM } from '@/app/hooks/useStatsCalculations'

interface StatsViewProps {
    isLoading: boolean
    user: { id: string; email?: string } | null

    // Grouped Props
    data: {
        records: Investment[]
        hasRecords: boolean
    }
    ui: {
        selectedYear: number
        setSelectedYear: (year: number) => void
        showCashHoldSheet: boolean
        handleCloseCashHold: () => void
        showContributionSheet: boolean
        handleCloseContribution: () => void
        handleShowCashHold: () => void
        handleShowContribution: () => void
    }
    filter: {
        periodPreset: string
        setPeriodPreset: (preset: any) => void
        periodLabel: string
        customDateRange: any
        setCustomDateRange: (range: any) => void
        handleCustomPeriod: () => void
    }
    calculations: {
        totalExpectedAsset: number
        totalMonthlyPayment: number
        hasMaturedInvestments: boolean
        maturedItems: CashHoldItemVM[]
        thisMonth: {
            totalPayment: number
            completedPayment: number
            progress: number
            remainingPayment: number
        }
        calculateFutureValue: (monthlyAmount: number, T: number, P: number, R?: number) => number
    }
    chart: {
        periodCompletionRate: number
        chartData: any[]
        chartBarColor: string
    }
}

export default function StatsView({
    isLoading,
    user,
    data,
    ui,
    filter,
    calculations,
    chart,
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

    const { showCashHoldSheet, showContributionSheet, handleCloseCashHold, handleCloseContribution, selectedYear } = ui
    const { records } = data
    const { totalMonthlyPayment, calculateFutureValue, maturedItems } = calculations

    const { contributionItems } = useMonthlyContribution({
        items: records,
        totalAmount: totalMonthlyPayment,
    })

    return (
        <main className="min-h-screen bg-surface">
            <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-6 pb-24">
                <StatsHeader />

                <StatsContent
                    data={data}
                    ui={ui}
                    calculations={calculations}
                    filter={filter}
                    chart={chart}
                />
            </div>

            {showCashHoldSheet && (
                <CashHoldItemsSheet
                    maturedItems={maturedItems}
                    onClose={handleCloseCashHold}
                />
            )}

            {showContributionSheet && (
                <MonthlyContributionSheet
                    contributionItems={contributionItems}
                    totalAmount={totalMonthlyPayment}
                    onClose={handleCloseContribution}
                />
            )}
        </main>
    )
}
