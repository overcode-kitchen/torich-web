'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import { useAutoSettleMaturedRecords } from '@/app/hooks/investment/useAutoSettleMaturedRecords'
import { useInvestmentFilter } from '@/app/hooks/investment/filter/useInvestmentFilter'
import { useHomePageUI } from '@/app/hooks/ui/useHomePageUI'
import HomeView from '@/app/components/HomeView'

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  const { records, isLoading: dataLoading, refetch } = useInvestmentsContext()
  const userId = user?.id
  const { totalMonthlyPayment } = useInvestmentFilter(records)

  // 만기 도달 + 미정산 예적금을 자동 정산하고 비차단 토스트로 안내한다.
  // 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
  useAutoSettleMaturedRecords()

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

  const { isBrandStoryOpen, setIsBrandStoryOpen, showBrandStoryCard, pendingBrandStoryUndo, dismissBrandStoryCard, undoBrandStoryDismiss } = useHomePageUI()

  return (
    <HomeView
      isLoading={authLoading || dataLoading}
      user={user}
      records={records}
      totalMonthlyPayment={totalMonthlyPayment}
      showMonthlyAmount={showMonthlyAmount}
      onToggleMonthlyAmount={toggleMonthlyAmount}
      onRefresh={async () => {
        await refetch()
      }}
      isBrandStoryOpen={isBrandStoryOpen}
      setIsBrandStoryOpen={setIsBrandStoryOpen}
      showBrandStoryCard={showBrandStoryCard}
      pendingBrandStoryUndo={pendingBrandStoryUndo}
      onCloseBrandStoryCard={dismissBrandStoryCard}
      onUndoBrandStory={undoBrandStoryDismiss}
    />
  )
}
