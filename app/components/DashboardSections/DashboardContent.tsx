'use client'

import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Investment } from '@/app/types/investment'
import UpcomingInvestments from '@/app/components/UpcomingInvestments'
import RateUpdateToast from './RateUpdateToast'
import MonthlyAmountCard from './MonthlyAmountCard'
import BrandStoryCard from './BrandStoryCard'
import BrandStoryBottomSheet from './BrandStoryBottomSheet'
import InvestmentListSection from './InvestmentListSection'
import EmptyState from './EmptyState'

type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'
type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

interface DashboardContentProps {
    data: {
        records: Investment[]
        filteredRecords: Investment[]
        activeRecords: Investment[]
        totalMonthlyPayment: number
    }
    ui: {
        showRateUpdateToast: boolean
        onAddClick: () => void
    }
    filter: {
        filterStatus: FilterStatus
        onFilterChange: (status: FilterStatus) => void
        sortBy: SortBy
        onSortChange: (sort: SortBy) => void
    }
    list: {
        listExpanded: boolean
        displayRecords: Investment[]
        hasMoreList: boolean
        remainingListCount: number
        toggleListExpansion: () => void
        onItemClick: (item: Investment) => void
    }
    brandStory: {
        showBrandStoryCard: boolean
        onCloseBrandStoryCard: () => void
        pendingBrandStoryUndo: boolean
        onUndoBrandStory: () => void
        isBrandStoryOpen: boolean
        onOpenBrandStory: () => void
        onCloseBrandStory: () => void
    }
    settings: {
        showMonthlyAmount: boolean
        onToggleMonthlyAmount: () => void
    }
    calculations: {
        calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
    }
}

export default function DashboardContent({
    data,
    ui,
    filter,
    list,
    brandStory,
    settings,
    calculations,
}: DashboardContentProps) {
    const { records, filteredRecords, activeRecords, totalMonthlyPayment } = data
    const { showRateUpdateToast, onAddClick } = ui
    const { filterStatus, onFilterChange, sortBy, onSortChange } = filter
    const { listExpanded, displayRecords, hasMoreList, remainingListCount, toggleListExpansion, onItemClick } = list
    const { showBrandStoryCard, onCloseBrandStoryCard, pendingBrandStoryUndo, onUndoBrandStory, isBrandStoryOpen, onOpenBrandStory, onCloseBrandStory } = brandStory
    const { showMonthlyAmount, onToggleMonthlyAmount } = settings
    const { calculateFutureValue } = calculations

    return (
        <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-4 space-y-4">
            <RateUpdateToast showRateUpdateToast={showRateUpdateToast} />

            {activeRecords.length > 0 && <UpcomingInvestments records={activeRecords} />}

            <Button
                size="lg"
                className="w-full rounded-2xl"
                onClick={onAddClick}
            >
                <Plus className="w-5 h-5" />
                투자 목록 추가하기
            </Button>

            <MonthlyAmountCard
                records={records}
                totalMonthlyPayment={totalMonthlyPayment}
                showMonthlyAmount={showMonthlyAmount}
                onToggleMonthlyAmount={onToggleMonthlyAmount}
            />

            <BrandStoryCard
                showBrandStoryCard={showBrandStoryCard}
                onOpenBrandStory={onOpenBrandStory}
                onCloseBrandStoryCard={onCloseBrandStoryCard}
            />

            {pendingBrandStoryUndo && (
                <div
                    className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-surface-dark text-white px-4 py-3 shadow-lg max-w-md md:max-w-lg lg:max-w-2xl mx-auto"
                    role="status"
                >
                    <span className="text-sm font-medium">카드가 닫혔어요</span>
                    <button
                        type="button"
                        onClick={onUndoBrandStory}
                        className="text-sm font-semibold text-brand-300 hover:text-brand-200 transition-colors"
                    >
                        되돌리기
                    </button>
                </div>
            )}

            <BrandStoryBottomSheet
                isBrandStoryOpen={isBrandStoryOpen}
                onCloseBrandStory={onCloseBrandStory}
            />

            {records.length > 0 ? (
                <InvestmentListSection
                    records={records}
                    filteredRecords={filteredRecords}
                    displayRecords={displayRecords}
                    filterStatus={filterStatus}
                    onFilterChange={onFilterChange}
                    sortBy={sortBy}
                    onSortChange={onSortChange}
                    onItemClick={onItemClick}
                    calculateFutureValue={calculateFutureValue}
                    listExpanded={listExpanded}
                    onListExpandToggle={toggleListExpansion}
                    hasMoreList={hasMoreList}
                    remainingListCount={remainingListCount}
                />
            ) : (
                <EmptyState onAddClick={onAddClick} />
            )}

            {records.length > 0 && (
                <Link
                    href="/stats"
                    className="block text-center py-3 text-sm text-muted-foreground hover:text-foreground-soft transition-colors"
                >
                    예상 자산 · 수익 차트 보기 →
                </Link>
            )}
        </div>
    )
}
