'use client'

import Link from 'next/link'
import ExpectedAssetSection from '@/app/components/StatsSections/ExpectedAssetSection'
import MonthlyComplianceHeroSection from '@/app/components/StatsSections/MonthlyComplianceHeroSection'
import MonthlyTrendSection from '@/app/components/StatsSections/MonthlyTrendSection'
import ModeBreakdownSection from '@/app/components/StatsSections/ModeBreakdownSection'
import StatsGoalProgressSection from '@/app/components/StatsSections/StatsGoalProgressSection'
import type { Investment } from '@/app/types/investment'
import type {
    GoalStats,
    HabitStats,
} from '@/app/hooks/investment/calculations/useStatsCalculations'
import type { PaymentHistoryMap } from '@/app/hooks/payment/usePaymentHistory'
import type { ConsistencyInsight } from '@/app/hooks/chart/useChartData'

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
        chartEmphasisColor: string
        consistency: ConsistencyInsight | null
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
    const { handleShowContribution } = ui
    const {
        totalPaidPrincipal,
        totalMonthlyPayment,
        thisMonth,
        goalStats,
        habitStats,
    } = calculations
    const { periodPreset, setPeriodPreset, periodLabel, customDateRange, setCustomDateRange, handleCustomPeriod } = filter
    const { periodCompletionRate, chartData, chartBarColor, chartEmphasisColor, consistency } = chart

    return (
        <>
            {/* ① 이행 Hero — 이번 달 이행 + (구분선) 월별 이행 추세를 한 카드에 묶음.
                같은 주제의 줌아웃이라 카드를 나누지 않고 공통 영역으로 연결감을 유지한다. */}
            <MonthlyComplianceHeroSection hasRecords={hasRecords} thisMonth={thisMonth}>
                {hasRecords && (
                    <MonthlyTrendSection
                        periodPreset={periodPreset as any}
                        setPeriodPreset={setPeriodPreset}
                        periodLabel={periodLabel}
                        customDateRange={customDateRange}
                        setCustomDateRange={setCustomDateRange}
                        handleCustomPeriod={handleCustomPeriod}
                        periodCompletionRate={periodCompletionRate}
                        chartData={chartData}
                        chartBarColor={chartBarColor}
                        chartEmphasisColor={chartEmphasisColor}
                        consistency={consistency}
                    />
                )}
            </MonthlyComplianceHeroSection>

            {/* ② 목표 · 진척 묶음 */}
            <StatsGoalProgressSection records={records} />
            {hasRecords && (
                <ModeBreakdownSection goalStats={goalStats} habitStats={habitStats} />
            )}

            {/* ③ 자산 요약 (톤다운, 맨 아래 보조 카드) */}
            {hasRecords && (
                <ExpectedAssetSection
                    totalPaidPrincipal={totalPaidPrincipal}
                    totalMonthlyPayment={totalMonthlyPayment}
                    onShowContribution={handleShowContribution}
                />
            )}

            <Link
                href="/faq"
                className="block text-center pt-3 pb-4 text-sm text-muted-foreground hover:text-foreground-soft transition-colors"
            >
                토리치는 왜 수익률을 안 보여주나요? →
            </Link>
        </>
    )
}
