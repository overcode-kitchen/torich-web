'use client'

import { Suspense } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import MonthlyContributionSheet from './MonthlyContributionSheet'
import { useMonthlyContribution } from '@/app/hooks/investment/calculations/useMonthlyContribution'
import StatsContent from '@/app/components/StatsSections/StatsContent'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'

import type {
    StatsCalculations,
    StatsChart,
    StatsData,
    StatsFilter,
} from '@/app/components/StatsSections/stats-props'
import type { PaymentHistoryMap } from '@/app/types/payment'

interface StatsViewProps {
    isLoading: boolean
    user: { id: string; email?: string } | null

    // Grouped Props (stats-props.ts 공용 타입)
    data: StatsData
    payment: {
        completedPayments: PaymentHistoryMap
        retroactivePayments: PaymentHistoryMap
    }
    ui: {
        showContributionSheet: boolean
        handleCloseContribution: () => void
        handleShowContribution: () => void
    }
    filter: StatsFilter
    calculations: StatsCalculations
    chart: StatsChart
}

export default function StatsView({
    isLoading,
    user,
    data,
    payment,
    ui,
    filter,
    calculations,
    chart,
}: StatsViewProps) {
    // "이번 달 투자 내역"은 지금 매달 납입 중인 것만 — 배지(totalMonthlyPayment)와 같은 기준(activeRecords)으로
    // 맞춰야 총액·비중이 어긋나지 않는다. 기간 종료된 기록은 제외 (#28).
    const { contributionItems } = useMonthlyContribution({
        items: data.activeRecords,
        totalAmount: calculations.totalMonthlyPayment,
    })

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

    const { showContributionSheet, handleCloseContribution } = ui
    const { totalMonthlyPayment } = calculations

    return (
        // 타이틀 없는 화면 — main의 bg-surface가 상태바(safe area)까지 덮어 회색으로 보이게 하고,
        // 콘텐츠는 env(safe-area-inset-top)만큼 내려 노치를 비운다. isNativeApp 게이트 없이 env를 직접 써
        // 웹(viewport-fit=cover) 시뮬레이터에서도 노치가 흰색 카드로 덮이지 않게 한다.
        <main
            className="min-h-screen bg-surface"
            style={{
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                paddingBottom: APP_TAB_CONTENT_PADDING_BOTTOM,
            }}
        >
            <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4">
                {/* StatsContent가 탭 상태를 useSearchParams로 읽는다 → 정적 export 프리렌더를 위해 Suspense 경계 필요 */}
                <Suspense fallback={null}>
                    <StatsContent
                        data={data}
                        payment={payment}
                        ui={ui}
                        calculations={calculations}
                        filter={filter}
                        chart={chart}
                    />
                </Suspense>
            </div>

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
