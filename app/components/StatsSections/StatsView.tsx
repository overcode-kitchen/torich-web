'use client'

import { CircleNotch } from '@phosphor-icons/react'
import CashHoldItemsSheet from './CashHoldItemsSheet'
import MonthlyContributionSheet from './MonthlyContributionSheet'
import type { Investment } from '@/app/types/investment'
import { useMonthlyContribution } from '@/app/hooks/investment/calculations/useMonthlyContribution'
import StatsHeader from '@/app/components/StatsSections/StatsHeader'
import StatsContent from '@/app/components/StatsSections/StatsContent'

import { CashHoldItemVM } from '@/app/hooks/investment/calculations/useStatsCalculations'

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
        <main
            className="min-h-screen bg-surface"
            style={{
                // 앱바 실제 높이(safe area + 48px) + 여유 8px
                paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)',
            }}
        >
            {/* 앱바: 배경은 화면 맨 위까지, 콘텐츠는 상태바 아래로만 (Safe Area) */}
            <header
                className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)',
                }}
            >
                <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4">
                    <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
                        <StatsHeader />
                    </div>
                </div>
            </header>

            <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 pb-24">
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
