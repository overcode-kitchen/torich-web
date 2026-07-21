'use client'

import Link from 'next/link'
import type { Investment } from '@/app/types/investment'
import MonthlyAmountCard from './MonthlyAmountCard'
import BrandStorySection from './BrandStorySection'
import GoalGroupSection from '@/app/components/GoalSections/GoalGroupSection'

interface DashboardContentProps {
    data: {
        records: Investment[]
        totalMonthlyPayment: number
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
            <GoalGroupSection records={records} />

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
