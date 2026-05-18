'use client'

import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Investment } from '@/app/types/investment'
import UpcomingInvestments from '@/app/components/UpcomingInvestments'
import type { useUpcomingInvestments } from '@/app/hooks/upcoming/useUpcomingInvestments'
import MonthlyAmountCard from './MonthlyAmountCard'
import BrandStorySection from './BrandStorySection'
import InvestmentListSection from './InvestmentListSection'
import EmptyState from './EmptyState'
import GoalSection from './GoalSection'

type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'
type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

interface DashboardContentProps {
    data: {
        records: Investment[]
        filteredRecords: Investment[]
        activeRecords: Investment[]
        totalMonthlyPayment: number
        upcomingInvestments: ReturnType<typeof useUpcomingInvestments>
    }
    ui: {
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
        onDelete?: (id: string) => Promise<void>
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
}

export default function DashboardContent({
    data,
    ui,
    filter,
    list,
    brandStory,
    settings,
}: DashboardContentProps) {
    const { records, filteredRecords, activeRecords, totalMonthlyPayment, upcomingInvestments } = data
    const { onAddClick } = ui
    const { filterStatus, onFilterChange, sortBy, onSortChange } = filter
    const { listExpanded, displayRecords, hasMoreList, remainingListCount, toggleListExpansion, onItemClick, onDelete } = list
    const { showBrandStoryCard, onCloseBrandStoryCard, pendingBrandStoryUndo, onUndoBrandStory, isBrandStoryOpen, onOpenBrandStory, onCloseBrandStory } = brandStory
    const { showMonthlyAmount, onToggleMonthlyAmount } = settings

    return (
        <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-4 space-y-4">
            {activeRecords.length > 0 && (
                <UpcomingInvestments
                    records={activeRecords}
                    data={upcomingInvestments}
                />
            )}

            {records.length > 0 && (
                <Button
                    size="lg"
                    className="w-full rounded-2xl"
                    onClick={onAddClick}
                >
                    <Plus className="w-5 h-5" />
                    투자 목록 추가하기
                </Button>
            )}

            <GoalSection records={records} />


            <MonthlyAmountCard
                records={records}
                totalMonthlyPayment={totalMonthlyPayment}
                showMonthlyAmount={showMonthlyAmount}
                onToggleMonthlyAmount={onToggleMonthlyAmount}
            />

            <BrandStorySection
                showBrandStoryCard={showBrandStoryCard}
                onOpenBrandStory={onOpenBrandStory}
                onCloseBrandStoryCard={onCloseBrandStoryCard}
                pendingBrandStoryUndo={pendingBrandStoryUndo}
                onUndoBrandStory={onUndoBrandStory}
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
                    onDelete={onDelete}
                    listExpanded={listExpanded}
                    onListExpandToggle={toggleListExpansion}
                    hasMoreList={hasMoreList}
                    remainingListCount={remainingListCount}
                />
            ) : (
                <EmptyState />
            )}

            {records.length > 0 && (
                <Link
                    href="/stats"
                    className="block text-center pt-3 pb-4 text-sm text-muted-foreground hover:text-foreground-soft transition-colors"
                >
                    적립 현황 보기 →
                </Link>
            )}
        </div>
    )
}
