'use client'

import { useRouter } from 'next/navigation'
import type { Investment } from '@/app/types/investment'
import { useDashboardUI } from '@/app/hooks/ui/useDashboardUI'
import { useUpcomingInvestments } from '@/app/hooks/upcoming/useUpcomingInvestments'
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
    <main
      className="min-h-screen bg-surface"
      style={{
        // 앱바 실제 높이(safe area + 48px) + 여유 8px
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)',
      }}
    >
      <RateUpdateToast showRateUpdateToast={showRateUpdateToast} />

      {/* 앱바: 상태바 아래 패딩 + 정확히 48px 높이의 바 (로고·알림) */}
      <header
        className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)',
        }}
      >
        <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
          <Header rightSlot={<NotificationInbox />} />
        </div>
      </header>

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
