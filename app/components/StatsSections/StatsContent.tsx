'use client'

import Link from 'next/link'
import ExpectedAssetSection from '@/app/components/StatsSections/ExpectedAssetSection'
import MonthlyComplianceHeroSection from '@/app/components/StatsSections/MonthlyComplianceHeroSection'
import MonthlyTrendSection from '@/app/components/StatsSections/MonthlyTrendSection'
import ModeBreakdownSection from '@/app/components/StatsSections/ModeBreakdownSection'
import StatsGoalProgressSection from '@/app/components/StatsSections/StatsGoalProgressSection'
import { useStatsInsights } from '@/app/hooks/stats/useStatsInsights'
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
    payment,
    ui,
    calculations,
    filter,
    chart,
}: StatsContentProps) {
    const { records, activeRecords, hasRecords } = data
    const { completedPayments } = payment
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

    // 이행 Hero 회전 서브라인용 칭찬 인사이트 (누적 원금·지난달보다 더)
    const insights = useStatsInsights({
        activeRecords,
        completedPayments,
        thisMonthCompleted: thisMonth.completedPayment,
    })

    // 이행(행동) 데이터가 쌓였는지 — 이번 달 예정 납입이 있거나 과거 활동이 1개월 이상.
    // 신규/저데이터 사용자는 이 값이 false → 화면이 비어 보이지 않게 목적 진척을 위로 끌어올린다.
    const hasComplianceData =
        thisMonth.totalPayment > 0 || (consistency?.activeMonths ?? 0) >= 1

    // 행동(이행·동기부여) 카드
    const hero = (
        <MonthlyComplianceHeroSection
            key="hero"
            hasRecords={hasRecords}
            thisMonth={thisMonth}
            insights={insights}
        />
    )

    // 회고(월별 이행 추세·꾸준함) — Hero에서 분리한 독립 카드. 이행 데이터가 있을 때만 노출.
    const trend = hasRecords && hasComplianceData ? (
        <section key="trend" className="bg-card rounded-2xl p-5 mb-4">
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
        </section>
    ) : null

    // 결과(모은 자산) — 모은 돈이 0이면 '0원' 노이즈 대신 숨김.
    const asset = hasRecords && totalPaidPrincipal > 0 ? (
        <ExpectedAssetSection
            key="asset"
            totalPaidPrincipal={totalPaidPrincipal}
            totalMonthlyPayment={totalMonthlyPayment}
            onShowContribution={handleShowContribution}
        />
    ) : null

    // 결과(목적 진척) — 활성 목적이 없으면 컴포넌트가 스스로 null 렌더.
    const goalProgress = <StatsGoalProgressSection key="goal" records={records} />

    // 결과(투자 상태 요약) — 목표형·적립형 혼재 시에만 컴포넌트가 렌더.
    const status = hasRecords ? (
        <ModeBreakdownSection key="status" goalStats={goalStats} habitStats={habitStats} />
    ) : null

    // 기본: 행동(이행→추세) → 결과(자산→목적→상태).
    // 저데이터: 이행이 비어 있으니 목적 진척을 맨 위로 올려 첫 화면을 채운다.
    const sections = hasComplianceData
        ? [hero, trend, asset, goalProgress, status]
        : [goalProgress, hero, asset, status]

    return (
        <>
            {sections}

            <Link
                href="/faq"
                className="block text-center pt-3 pb-4 text-sm text-muted-foreground hover:text-foreground-soft transition-colors"
            >
                토리치는 왜 수익률을 안 보여주나요? →
            </Link>
        </>
    )
}
