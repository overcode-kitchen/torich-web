'use client'

import { useRouter } from 'next/navigation'
import type { Investment } from '@/app/types/investment'
import { useDashboardUI } from '@/app/hooks/useDashboardUI'
import { useUpcomingInvestments } from '@/app/hooks/useUpcomingInvestments'
import Header from './DashboardSections/Header'
import RateUpdateToast from './DashboardSections/RateUpdateToast'
import NotificationInbox from './DashboardSections/NotificationInbox'
import DashboardContent from './DashboardSections/DashboardContent'

type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'
type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

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
  const upcomingInvestmentsData = useUpcomingInvestments(activeRecords)

  const {
    listExpanded,
    displayRecords,
    hasMoreList,
    remainingListCount,
    toggleListExpansion,
  } = useDashboardUI({
    filteredRecords,
    filterStatus,
    sortBy,
  })

  return (
    <main className="min-h-screen bg-surface">
      <RateUpdateToast showRateUpdateToast={showRateUpdateToast} />
      <Header rightSlot={<NotificationInbox />} />

      <DashboardContent
        data={{
          records,
          filteredRecords,
          activeRecords,
          totalMonthlyPayment,
          upcomingInvestments: upcomingInvestmentsData,
        }}
        ui={{
          showRateUpdateToast,
          onAddClick: () => router.push('/add'),
        }}
        filter={{
          filterStatus,
          onFilterChange,
          sortBy,
          onSortChange,
        }}
        list={{
          listExpanded,
          displayRecords,
          hasMoreList,
          remainingListCount,
          toggleListExpansion,
          onItemClick,
        }}
        brandStory={{
          showBrandStoryCard,
          onCloseBrandStoryCard,
          pendingBrandStoryUndo,
          onUndoBrandStory,
          isBrandStoryOpen,
          onOpenBrandStory,
          onCloseBrandStory,
        }}
        settings={{
          showMonthlyAmount,
          onToggleMonthlyAmount,
        }}
        calculations={{
          calculateFutureValue,
        }}
      />
    </main>
  )
}
