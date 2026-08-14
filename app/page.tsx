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

  // 설정을 읽기 전에는 가린 채로 그린다. 가리기를 켜둔 사용자에게 진입할 때마다 금액이 스쳐
  // 보이면 기능 자체가 무의미해진다 — 잘못 가리는 건 불편이고, 잘못 보여주는 건 정보 노출이다.
  const [showMonthlyAmount, setShowMonthlyAmount] = useState<boolean>(false)

  // Load from DB (PGRST116 = 행 없음 → 신규 사용자, 가린 적이 없으므로 '보임'으로 확정 / 토스트 없음)
  useEffect(() => {
    if (!userId) return

    const fetchSetting = async () => {
      const client = createClient()
      const { data, error } = await client
        .from('user_settings')
        .select('show_monthly_amount')
        .eq('user_id', userId)
        .single()

      if (error) {
        // 조회 실패는 가린 상태를 유지한다(사용자가 '보기'로 직접 풀 수 있다).
        if (error.code === 'PGRST116') setShowMonthlyAmount(true)
        else toastError(TOAST_MESSAGES.settingsLoadFailed)
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
