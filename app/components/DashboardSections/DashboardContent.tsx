'use client'

import Link from 'next/link'
import type { Investment } from '@/app/types/investment'
import type { useUpcomingInvestments } from '@/app/hooks/upcoming/useUpcomingInvestments'
import MonthlyAmountCard from './MonthlyAmountCard'
import BrandStorySection from './BrandStorySection'
import EmptyState from './EmptyState'
import GoalGroupSection from '@/app/components/GoalSections/GoalGroupSection'

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

/**
 * 홈 메인 컨텐츠.
 *
 * 목적 중심 재구성: 투자를 목적 아래 묶어 보여주는 GoalGroupSection이 메인이며
 * 이전의 UpcomingInvestments(체크리스트) / GoalSection(캐러셀) /
 * InvestmentListSection(평면 목록) 역할을 모두 흡수했다.
 * filter/list/upcomingInvestments props는 호환을 위해 시그니처에만 남겨둔다.
 */
export default function DashboardContent({
    data,
    brandStory,
    settings,
}: DashboardContentProps) {
    const { records, totalMonthlyPayment } = data
    const { showBrandStoryCard, onCloseBrandStoryCard, pendingBrandStoryUndo, onUndoBrandStory, isBrandStoryOpen, onOpenBrandStory, onCloseBrandStory } = brandStory
    const { showMonthlyAmount, onToggleMonthlyAmount } = settings

    return (
        <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-4 space-y-4">
            {records.length > 0 ? (
                <GoalGroupSection records={records} />
            ) : (
                <EmptyState />
            )}

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
