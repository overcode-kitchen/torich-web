'use client'

import { useAuth } from '@/app/hooks/useAuth'
import { useInvestments } from '@/app/hooks/useInvestments'
import { useRateUpdate } from '@/app/hooks/useRateUpdate'
import { useInvestmentFilter } from '@/app/hooks/useInvestmentFilter'
import { useLocalStorage } from '@/app/hooks/useLocalStorage'
import { useHomePageUI } from '@/app/hooks/useHomePageUI'
import HomeView from '@/app/components/HomeView'
import { calculateSimulatedValue } from '@/app/utils/finance'

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const { records, isLoading: dataLoading, updateInvestment, deleteInvestment, refetch } = useInvestments(user?.id)
  const { isUpdating: isUpdatingRates, showToast, checkAndUpdate } = useRateUpdate(user?.id)
  const { filterStatus, setFilterStatus, sortBy, setSortBy, filteredRecords, activeRecords, totalMonthlyPayment } = useInvestmentFilter(records, calculateSimulatedValue)
  const [showMonthlyAmount, setShowMonthlyAmount] = useLocalStorage<boolean>('torich_show_monthly_amount', true)
  const { detailItem, setDetailItem, isBrandStoryOpen, setIsBrandStoryOpen, showBrandStoryCard, setShowBrandStoryCard, pendingBrandStoryUndo, dismissBrandStoryCard, undoBrandStoryDismiss } = useHomePageUI({ userId: user?.id, records, checkAndUpdate, refetch })

  return (
    <HomeView
      isLoading={authLoading || dataLoading}
      isUpdatingRates={isUpdatingRates}
      user={user}
      records={records}
      filteredRecords={filteredRecords}
      activeRecords={activeRecords}
      totalMonthlyPayment={totalMonthlyPayment}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      sortBy={sortBy}
      setSortBy={setSortBy}
      showMonthlyAmount={showMonthlyAmount}
      onToggleMonthlyAmount={() => setShowMonthlyAmount((prev: boolean) => !prev)}
      detailItem={detailItem}
      setDetailItem={setDetailItem}
      updateInvestment={updateInvestment}
      deleteInvestment={deleteInvestment}
      isBrandStoryOpen={isBrandStoryOpen}
      setIsBrandStoryOpen={setIsBrandStoryOpen}
      showBrandStoryCard={showBrandStoryCard}
      setShowBrandStoryCard={setShowBrandStoryCard}
      pendingBrandStoryUndo={pendingBrandStoryUndo}
      onCloseBrandStoryCard={dismissBrandStoryCard}
      onUndoBrandStory={undoBrandStoryDismiss}
      showToast={showToast}
      calculateSimulatedValue={calculateSimulatedValue}
      refetch={refetch}
    />
  )
}
