'use client'

import { CircleNotch } from '@phosphor-icons/react'
import Dashboard from '@/app/components/Dashboard'
import LandingPage from '@/app/components/LandingPage'
import PullToRefreshIndicator from '@/app/components/PullToRefreshIndicator'
import { usePullToRefresh } from '@/app/hooks/ui/usePullToRefresh'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import type { Investment } from '@/app/types/investment'
import type { User } from '@supabase/supabase-js'

interface HomeViewProps {
    isLoading: boolean
    isUpdatingRates: boolean
    user: User | null

    // Data
    records: Investment[]
    totalMonthlyPayment: number

    // Settings
    showMonthlyAmount: boolean
    onToggleMonthlyAmount: () => void

    // Pull-to-refresh
    onRefresh: () => Promise<void>

    // Brand Story
    isBrandStoryOpen: boolean
    setIsBrandStoryOpen: (open: boolean) => void
    showBrandStoryCard: boolean
    pendingBrandStoryUndo: boolean
    onCloseBrandStoryCard: () => void
    onUndoBrandStory: () => void
}

export default function HomeView({
    isLoading,
    isUpdatingRates,
    user,
    records,
    totalMonthlyPayment,
    showMonthlyAmount,
    onToggleMonthlyAmount,
    onRefresh,
    isBrandStoryOpen,
    setIsBrandStoryOpen,
    showBrandStoryCard,
    pendingBrandStoryUndo,
    onCloseBrandStoryCard,
    onUndoBrandStory,
}: HomeViewProps) {
    const isNativeApp = useIsNativeApp()
    const { pullDistance, isRefreshing, threshold } = usePullToRefresh({
        onRefresh,
        disabled: isLoading || isUpdatingRates || !user,
    })
    const indicatorTopOffset = isNativeApp
        ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px)'
        : '56px'

    // 풀스크린 로딩은 데이터가 한 번도 들어오지 않은 '초기 로딩'에만 적용한다.
    // 백그라운드 refetch(visibilitychange, 추가/삭제 후 갱신 등) 동안에는 기존 화면을 유지해 깜빡임을 막는다.
    const hasNoRecords = records.length === 0

    if (isLoading && hasNoRecords) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
            </main>
        )
    }

    if (isUpdatingRates && hasNoRecords) {
        return (
            <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
                <CircleNotch className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-foreground-muted text-sm">최신 데이터 반영 중...</p>
            </main>
        )
    }

    if (!user) return <LandingPage />

    return (
        <>
            <PullToRefreshIndicator
                pullDistance={pullDistance}
                isRefreshing={isRefreshing}
                threshold={threshold}
                topOffset={indicatorTopOffset}
            />
            <Dashboard
                records={records}
                totalMonthlyPayment={totalMonthlyPayment}
                showMonthlyAmount={showMonthlyAmount}
                onToggleMonthlyAmount={onToggleMonthlyAmount}
                showBrandStoryCard={showBrandStoryCard}
                onCloseBrandStoryCard={onCloseBrandStoryCard}
                pendingBrandStoryUndo={pendingBrandStoryUndo}
                onUndoBrandStory={onUndoBrandStory}
                isBrandStoryOpen={isBrandStoryOpen}
                onOpenBrandStory={() => setIsBrandStoryOpen(true)}
                onCloseBrandStory={() => setIsBrandStoryOpen(false)}
            />
        </>
    )
}
