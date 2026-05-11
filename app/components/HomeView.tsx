'use client'

import { CircleNotch } from '@phosphor-icons/react'
import Dashboard from '@/app/components/Dashboard'
import LandingPage from '@/app/components/LandingPage'
import PullToRefreshIndicator from '@/app/components/PullToRefreshIndicator'
import { usePullToRefresh } from '@/app/hooks/ui/usePullToRefresh'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import type { Investment } from '@/app/types/investment'
import type { User } from '@supabase/supabase-js'

// Dashboard.tsx에서 타입 재정의 (export되지 않아서)
type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'
type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

interface HomeViewProps {
    isLoading: boolean
    isUpdatingRates: boolean
    // records가 이미 있는 상태에서 도는 백그라운드 동기화. 헤더 우상단 작은 인디케이터로만 표시한다.
    isBackgroundSyncing: boolean
    user: User | null

    // Data
    records: Investment[]
    filteredRecords: Investment[]
    activeRecords: Investment[]
    totalMonthlyPayment: number

    // Filter & Sort
    filterStatus: FilterStatus
    setFilterStatus: (status: FilterStatus) => void
    sortBy: SortBy
    setSortBy: (sort: SortBy) => void

    // Settings
    showMonthlyAmount: boolean
    onToggleMonthlyAmount: () => void

    // List item click → navigate to detail page
    onItemClick: (item: Investment) => void
    onDeleteInvestment?: (id: string) => Promise<void>

    // Pull-to-refresh
    onRefresh: () => Promise<void>

    // Brand Story
    isBrandStoryOpen: boolean
    setIsBrandStoryOpen: (open: boolean) => void
    showBrandStoryCard: boolean
    setShowBrandStoryCard: (show: boolean) => void
    pendingBrandStoryUndo: boolean
    onCloseBrandStoryCard: () => void
    onUndoBrandStory: () => void

    calculateSimulatedValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function HomeView({
    isLoading,
    isUpdatingRates,
    isBackgroundSyncing,
    user,
    records,
    filteredRecords,
    activeRecords,
    totalMonthlyPayment,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    showMonthlyAmount,
    onToggleMonthlyAmount,
    onItemClick,
    onDeleteInvestment,
    onRefresh,
    isBrandStoryOpen,
    setIsBrandStoryOpen,
    showBrandStoryCard,
    setShowBrandStoryCard,
    pendingBrandStoryUndo,
    onCloseBrandStoryCard,
    onUndoBrandStory,
    calculateSimulatedValue,
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
            isBackgroundSyncing={isBackgroundSyncing}
            records={records}
            filteredRecords={filteredRecords}
            activeRecords={activeRecords}
            totalMonthlyPayment={totalMonthlyPayment}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showMonthlyAmount={showMonthlyAmount}
            onToggleMonthlyAmount={onToggleMonthlyAmount}
            onItemClick={onItemClick}
            onDelete={onDeleteInvestment}
            showBrandStoryCard={showBrandStoryCard}
            onCloseBrandStoryCard={onCloseBrandStoryCard}
            pendingBrandStoryUndo={pendingBrandStoryUndo}
            onUndoBrandStory={onUndoBrandStory}
            isBrandStoryOpen={isBrandStoryOpen}
            onOpenBrandStory={() => setIsBrandStoryOpen(true)}
            onCloseBrandStory={() => setIsBrandStoryOpen(false)}
            calculateFutureValue={calculateSimulatedValue}
        />
        </>
    )
}
