'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Investment } from '@/app/types/investment'
import UpcomingInvestments from '@/app/components/UpcomingInvestments'
import RateUpdateToast from './DashboardSections/RateUpdateToast'
import Header from './DashboardSections/Header'
import NotificationInbox from './DashboardSections/NotificationInbox'
import MonthlyAmountCard from './DashboardSections/MonthlyAmountCard'
import BrandStoryCard from './DashboardSections/BrandStoryCard'
import BrandStoryBottomSheet from './DashboardSections/BrandStoryBottomSheet'
import InvestmentListSection from './DashboardSections/InvestmentListSection'
import EmptyState from './DashboardSections/EmptyState'

type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'
type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

const INITIAL_LIST_COUNT = 10

export interface DashboardProps {
  records: Investment[]
  filteredRecords: Investment[]
  activeRecords: Investment[]
  totalMonthlyPayment: number

  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void

  showMonthlyAmount: boolean
  onToggleMonthlyAmount: () => void

  onItemClick: (item: Investment) => void

  showBrandStoryCard: boolean
  onCloseBrandStoryCard: () => void
  pendingBrandStoryUndo: boolean
  onUndoBrandStory: () => void
  isBrandStoryOpen: boolean
  onOpenBrandStory: () => void
  onCloseBrandStory: () => void

  showRateUpdateToast: boolean

  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function Dashboard({
  records,
  filteredRecords,
  activeRecords,
  totalMonthlyPayment,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  showMonthlyAmount,
  onToggleMonthlyAmount,
  onItemClick,
  showBrandStoryCard,
  onCloseBrandStoryCard,
  pendingBrandStoryUndo,
  onUndoBrandStory,
  isBrandStoryOpen,
  onOpenBrandStory,
  onCloseBrandStory,
  showRateUpdateToast,
  calculateFutureValue,
}: DashboardProps) {
  const router = useRouter()
  const [listExpanded, setListExpanded] = useState(false)
  const displayRecords = listExpanded ? filteredRecords : filteredRecords.slice(0, INITIAL_LIST_COUNT)
  const hasMoreList = filteredRecords.length > INITIAL_LIST_COUNT
  const remainingListCount = filteredRecords.length - INITIAL_LIST_COUNT

  useEffect(() => {
    setListExpanded(false)
  }, [filterStatus, sortBy])

  return (
    <main className="min-h-screen bg-surface">
      <RateUpdateToast showRateUpdateToast={showRateUpdateToast} />
      <Header rightSlot={<NotificationInbox />} />

      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-4 space-y-4">
        {activeRecords.length > 0 && <UpcomingInvestments records={activeRecords} />}

        <Button
          size="lg"
          className="w-full rounded-2xl"
          onClick={() => router.push('/add')}
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
            onListExpandToggle={() => setListExpanded((prev) => !prev)}
            hasMoreList={hasMoreList}
            remainingListCount={remainingListCount}
          />
        ) : (
          <EmptyState onAddClick={() => router.push('/add')} />
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
    </main>
  )
}
