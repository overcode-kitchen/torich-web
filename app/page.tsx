'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { useInvestments } from '@/app/hooks/investment/data/useInvestments'
import { useRateUpdate } from '@/app/hooks/stock/useRateUpdate'
import { useInvestmentFilter } from '@/app/hooks/investment/filter/useInvestmentFilter'
import { useHomePageUI } from '@/app/hooks/ui/useHomePageUI'
import HomeView from '@/app/components/HomeView'
import { calculateSimulatedValue } from '@/app/utils/finance'

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  const { records, isLoading: dataLoading, updateInvestment, deleteInvestment, refetch } = useInvestments(user?.id)
  const userId = user?.id
  const { isUpdating: isUpdatingRates, checkAndUpdate } = useRateUpdate(userId)
  const { filterStatus, setFilterStatus, sortBy, setSortBy, filteredRecords, activeRecords, totalMonthlyPayment } = useInvestmentFilter(records, calculateSimulatedValue)

  const [showMonthlyAmount, setShowMonthlyAmount] = useState<boolean>(true)

  // Load from DB (PGRST116 = 행 없음 → 신규 사용자, 기본값 유지 / 토스트 없음)
  useEffect(() => {
    if (!userId) return

    const fetchSetting = async () => {
      const client = createClient()
      const { data, error } = await client
        .from('user_settings')
        .select('show_monthly_amount')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        toastError(TOAST_MESSAGES.settingsLoadFailed)
        return
      }
      if (data) {
        setShowMonthlyAmount(data.show_monthly_amount ?? true)
      }
    }
    fetchSetting()
  }, [userId])

  const toggleMonthlyAmount = async () => {
    const next = !showMonthlyAmount
    setShowMonthlyAmount(next)

    if (user) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, show_monthly_amount: next }, { onConflict: 'user_id' })

      if (error) {
        setShowMonthlyAmount(!next)
        toastError(TOAST_MESSAGES.saveFailed)
      }
    }
  }

  // 다른 페이지에서 돌아올 때(삭제/수정 후 복귀 등) 목록 자동 갱신
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refetch()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refetch])

  const router = useRouter()
  const { isBrandStoryOpen, setIsBrandStoryOpen, showBrandStoryCard, setShowBrandStoryCard, pendingBrandStoryUndo, dismissBrandStoryCard, undoBrandStoryDismiss } = useHomePageUI({ userId: user?.id, records, checkAndUpdate, refetch })

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
      onItemClick={(item) => router.push(`/investment?id=${item.id}`)}
      isBrandStoryOpen={isBrandStoryOpen}
      setIsBrandStoryOpen={setIsBrandStoryOpen}
      showBrandStoryCard={showBrandStoryCard}
      setShowBrandStoryCard={setShowBrandStoryCard}
      pendingBrandStoryUndo={pendingBrandStoryUndo}
      onCloseBrandStoryCard={dismissBrandStoryCard}
      onUndoBrandStory={undoBrandStoryDismiss}
      calculateSimulatedValue={calculateSimulatedValue}
    />
  )
}
