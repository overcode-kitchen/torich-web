'use client'

import { useEffect, useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { useAuth } from '@/app/hooks/useAuth'
import { useInvestments } from '@/app/hooks/useInvestments'
import { useRateUpdate } from '@/app/hooks/useRateUpdate'
import { useInvestmentFilter } from '@/app/hooks/useInvestmentFilter'
import { useLocalStorage } from '@/app/hooks/useLocalStorage'
import LandingPage from '@/app/components/LandingPage'
import Dashboard from '@/app/components/Dashboard'
import InvestmentDetailView from '@/app/components/InvestmentDetailView'
import type { Investment } from '@/app/types/investment'
import { calculateSimulatedValue } from '@/app/utils/finance'

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const { records, isLoading: dataLoading, isDeleting, isUpdating, updateInvestment, deleteInvestment, refetch } = useInvestments(user?.id)
  const { isUpdating: isUpdatingRates, showToast, checkAndUpdate } = useRateUpdate(user?.id)
  const { filterStatus, setFilterStatus, sortBy, setSortBy, filteredRecords, activeRecords, totalMonthlyPayment } = useInvestmentFilter(records, calculateSimulatedValue)
  const [showMonthlyAmount, setShowMonthlyAmount] = useLocalStorage<boolean>('torich_show_monthly_amount', true)
  const [detailItem, setDetailItem] = useState<Investment | null>(null)
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState<boolean>(false)
  const [showBrandStoryCard, setShowBrandStoryCard] = useState<boolean>(true)

  useEffect((): void => {
    if (!user?.id || records.length === 0) return
    void checkAndUpdate().then((updated: boolean) => {
      if (updated) void refetch()
    })
  }, [user?.id, records.length, checkAndUpdate, refetch])

  if (authLoading || dataLoading) {
    return (
      <main className="min-h-screen bg-coolgray-25 flex items-center justify-center">
        <IconLoader2 className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  if (isUpdatingRates) {
    return (
      <main className="min-h-screen bg-coolgray-25 flex flex-col items-center justify-center gap-4">
        <IconLoader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-coolgray-600 text-sm">최신 데이터 반영 중...</p>
      </main>
    )
  }

  if (!user) return <LandingPage />

  return (<><Dashboard records={records} filteredRecords={filteredRecords} activeRecords={activeRecords} totalMonthlyPayment={totalMonthlyPayment} filterStatus={filterStatus} onFilterChange={setFilterStatus} sortBy={sortBy} onSortChange={setSortBy} showMonthlyAmount={showMonthlyAmount} onToggleMonthlyAmount={() => setShowMonthlyAmount((prev: boolean) => !prev)} onItemClick={setDetailItem} showBrandStoryCard={showBrandStoryCard} onCloseBrandStoryCard={() => setShowBrandStoryCard(false)} isBrandStoryOpen={isBrandStoryOpen} onOpenBrandStory={() => setIsBrandStoryOpen(true)} onCloseBrandStory={() => setIsBrandStoryOpen(false)} showRateUpdateToast={showToast} calculateFutureValue={calculateSimulatedValue} />{detailItem && (<InvestmentDetailView item={detailItem} onBack={() => setDetailItem(null)} onUpdate={async (data) => { await updateInvestment(detailItem.id, data); setDetailItem((prev: Investment | null) => (prev ? { ...prev, ...data } : null)) }} onDelete={async () => { await deleteInvestment(detailItem.id); setDetailItem(null) }} isDeleting={isDeleting} isUpdating={isUpdating} calculateFutureValue={calculateSimulatedValue} />)}</>)
}
