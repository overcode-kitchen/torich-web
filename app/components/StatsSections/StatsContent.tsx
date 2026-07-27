'use client'

import Link from 'next/link'
import ExpectedAssetSection from '@/app/components/StatsSections/ExpectedAssetSection'
import MonthlyComplianceHeroSection from '@/app/components/StatsSections/MonthlyComplianceHeroSection'
import MonthlyTrendSection from '@/app/components/StatsSections/MonthlyTrendSection'
import GoalPaceSection from '@/app/components/StatsSections/GoalPaceSection'
import StatsGoalProgressSection from '@/app/components/StatsSections/StatsGoalProgressSection'
import { useStatsInsights } from '@/app/hooks/stats/useStatsInsights'
import type { Investment } from '@/app/types/investment'
import type { PaymentHistoryMap } from '@/app/types/payment'
import type { ConsistencyInsight } from '@/app/hooks/chart/useChartData'
import type { PeriodPreset } from '@/app/hooks/stats/usePeriodFilter'
import type { DateRange } from 'react-day-picker'

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
    }
    filter: {
        periodPreset: PeriodPreset
        setPeriodPreset: (preset: PeriodPreset) => void
        periodLabel: string
        customDateRange: DateRange | undefined
        setCustomDateRange: (range: DateRange | undefined) => void
        handleCustomPeriod: () => void
    }
    chart: {
        periodCompletionRate: number
        chartData: Array<{ name: string; rate: number; completed: number; total: number }>
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
    const { completedPayments, retroactivePayments } = payment
    const { handleShowContribution } = ui
    const {
        totalPaidPrincipal,
        totalMonthlyPayment,
        thisMonth,
    } = calculations
    const { periodPreset, setPeriodPreset, periodLabel, customDateRange, setCustomDateRange, handleCustomPeriod } = filter
    const { periodCompletionRate, chartData, chartBarColor, chartEmphasisColor, consistency } = chart

    // 이행 Hero 회전 서브라인용 칭찬 인사이트 (누적 원금·지난달보다 더)
    const insights = useStatsInsights({
        activeRecords,
        completedPayments,
        retroactivePayments,
        thisMonthCompleted: thisMonth.completedPayment,
        consistency,
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
                periodPreset={periodPreset}
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
    // 수익률 안내 링크는 '모은 돈'을 본 직후 "근데 수익률은?"이 떠오르는 자리라, 자산 카드에 딸린 각주로 바로 아래 묶는다.
    // 자산 카드가 숨으면(0원·신규) 이 링크도 함께 사라진다 — 돈 정보가 있을 때만 의미 있는 안내.
    const asset = hasRecords && totalPaidPrincipal > 0 ? (
        <div key="asset">
            <ExpectedAssetSection
                totalPaidPrincipal={totalPaidPrincipal}
                totalMonthlyPayment={totalMonthlyPayment}
                onShowContribution={handleShowContribution}
            />
            <Link
                href="/faq"
                className="block text-center pt-3 pb-4 text-sm text-muted-foreground hover:text-foreground-soft transition-colors"
            >
                토리치는 왜 수익률을 안 보여주나요? →
            </Link>
        </div>
    ) : null

    // 결과(목적 진척) — 활성 목적이 없으면 컴포넌트가 스스로 null 렌더.
    const goalProgress = <StatsGoalProgressSection key="goal" records={records} />

    // 결과(목표별 페이스) — 기한 있는 목적이 없으면 컴포넌트가 스스로 null 렌더.
    const pace = <GoalPaceSection key="pace" records={records} />

    // 기본: 행동(이행→추세) → 결과(목적→상태) → 자산(톤다운된 보조 카드, 수익률 해명 링크 동반).
    // 자산을 결과 맨 끝에 둬야 딸린 "왜 수익률을 안 보여주나" 링크가 콘텐츠 흐름을 끊지 않고 마무리 각주가 된다.
    // 저데이터: 이행이 비어 있으니 목적 진척을 맨 위로 올려 첫 화면을 채운다.
    const sections = hasComplianceData
        ? [hero, trend, goalProgress, pace, asset]
        : [goalProgress, hero, pace, asset]

    return <>{sections}</>
}
