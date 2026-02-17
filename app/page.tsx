'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/hooks/useAuth'
import { useInvestments } from '@/app/hooks/useInvestments'
import { useRateUpdate } from '@/app/hooks/useRateUpdate'
import { useInvestmentFilter } from '@/app/hooks/useInvestmentFilter'
import { useHomePageUI } from '@/app/hooks/useHomePageUI'
import HomeView from '@/app/components/HomeView'
import { calculateSimulatedValue } from '@/app/utils/finance'

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  const { records, isLoading: dataLoading, updateInvestment, deleteInvestment, refetch } = useInvestments(user?.id)
  const { isUpdating: isUpdatingRates, showToast, checkAndUpdate } = useRateUpdate(user?.id)
  const { filterStatus, setFilterStatus, sortBy, setSortBy, filteredRecords, activeRecords, totalMonthlyPayment } = useInvestmentFilter(records, calculateSimulatedValue)

  const [showMonthlyAmount, setShowMonthlyAmount] = useState<boolean>(true)

  // Load from DB
  useEffect(() => {
    if (!user) return

    const fetchSetting = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('show_monthly_amount')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setShowMonthlyAmount(data.show_monthly_amount ?? true)
      }
    }
    fetchSetting()
  }, [user, supabase])

  const toggleMonthlyAmount = async () => {
    const next = !showMonthlyAmount
    setShowMonthlyAmount(next)

    if (user) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, show_monthly_amount: next }, { onConflict: 'user_id' })

      if (error) console.error('Error updating show_monthly_amount', error)
    }
  }

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
      onToggleMonthlyAmount={toggleMonthlyAmount}
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
