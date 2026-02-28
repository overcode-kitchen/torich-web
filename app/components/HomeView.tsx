'use client'

import { CircleNotch } from '@phosphor-icons/react'
import Dashboard from '@/app/components/Dashboard'
import LandingPage from '@/app/components/LandingPage'
import type { Investment } from '@/app/types/investment'
import type { User } from '@supabase/supabase-js'

// Dashboard.tsx에서 타입 재정의 (export되지 않아서)
type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'
type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

interface HomeViewProps {
    isLoading: boolean
    isUpdatingRates: boolean
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

    // Brand Story
    isBrandStoryOpen: boolean
    setIsBrandStoryOpen: (open: boolean) => void
    showBrandStoryCard: boolean
    setShowBrandStoryCard: (show: boolean) => void
    pendingBrandStoryUndo: boolean
    onCloseBrandStoryCard: () => void
    onUndoBrandStory: () => void

    // UI Actions
    showToast: boolean
    calculateSimulatedValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function HomeView({
    isLoading,
    isUpdatingRates,
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
    isBrandStoryOpen,
    setIsBrandStoryOpen,
    showBrandStoryCard,
    setShowBrandStoryCard,
    pendingBrandStoryUndo,
    onCloseBrandStoryCard,
    onUndoBrandStory,
    showToast,
    calculateSimulatedValue,
}: HomeViewProps) {
    if (isLoading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
            </main>
        )
    }

    if (isUpdatingRates) {
        return (
            <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
                <CircleNotch className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-foreground-muted text-sm">최신 데이터 반영 중...</p>
            </main>
        )
    }

    if (!user) return <LandingPage />

    return (
        <Dashboard
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
            showBrandStoryCard={showBrandStoryCard}
            onCloseBrandStoryCard={onCloseBrandStoryCard}
            pendingBrandStoryUndo={pendingBrandStoryUndo}
            onUndoBrandStory={onUndoBrandStory}
            isBrandStoryOpen={isBrandStoryOpen}
            onOpenBrandStory={() => setIsBrandStoryOpen(true)}
            onCloseBrandStory={() => setIsBrandStoryOpen(false)}
            showRateUpdateToast={showToast}
            calculateFutureValue={calculateSimulatedValue}
        />
    )
}
