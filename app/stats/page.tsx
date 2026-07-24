'use client'

import { useEffect } from 'react'
import { useStatsData } from '@/app/hooks/investment/data/useStatsData'
import { usePeriodFilter } from '@/app/hooks/stats/usePeriodFilter'
import { useStatsCalculations } from '@/app/hooks/investment/calculations/useStatsCalculations'
import { useChartData } from '@/app/hooks/chart/useChartData'
import { useStatsPageUI } from '@/app/hooks/stats/useStatsPageUI'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { usePostponedPayments } from '@/app/hooks/payment/usePostponedPayments'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import StatsView from '@/app/components/StatsSections/StatsView'
import { track } from '@/app/lib/analytics'

export default function StatsPage() {
  const { user, records, activeRecords, isLoading, router } = useStatsData()
  const { completedPayments, retroactivePayments, capturedAmounts, isLoading: historyLoading } = usePaymentHistoryContext()
  // 미룸 회차 — 통계 분모(예정)에서 제외 (홈 체크리스트·캘린더와 동일 기준)
  const { postponedPayments } = usePostponedPayments()
  // '이미 모은 돈'(goal.external_amount) 합산용 — 자산 누적과 목적 진척의 금액 기준을 맞춘다
  const { goals } = useGoals(user?.id)

  const {
    showContributionSheet,
    hasRecords,
    handleShowContribution,
    handleCloseContribution,
  } = useStatsPageUI({ recordsLength: records.length })

  const {
    periodPreset,
    setPeriodPreset,
    customDateRange,
    setCustomDateRange,
    isCustomRange,
    effectiveMonths,
    periodLabel,
    handleCustomPeriod,
  } = usePeriodFilter()

  useEffect(() => {
    track('stats_view', { filter: periodPreset })
    // 진입 시 1회만 — 필터 변경은 stats_filter_change에서 별도 추적함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    totalPaidPrincipal,
    totalMonthlyPayment,
    thisMonth,
    goalStats,
    habitStats,
  } = useStatsCalculations({ records, activeRecords, completedPayments, retroactivePayments, postponedPayments, capturedAmounts, goals })

  const {
    periodCompletionRate,
    chartData,
    chartBarColor,
    chartEmphasisColor,
    consistency,
  } = useChartData({ activeRecords, completedPayments, postponedPayments, isCustomRange, effectiveMonths, customDateRange })

  if (!isLoading && !user) {
    router.replace('/login')
    return null
  }

  return (
    <StatsView
      isLoading={isLoading || historyLoading}
      user={user}
      data={{
        records,
        activeRecords,
        hasRecords,
      }}
      payment={{
        completedPayments,
        retroactivePayments,
      }}
      ui={{
        showContributionSheet,
        handleCloseContribution,
        handleShowContribution,
      }}
      filter={{
        periodPreset,
        setPeriodPreset,
        periodLabel,
        customDateRange,
        setCustomDateRange,
        handleCustomPeriod,
      }}
      calculations={{
        totalPaidPrincipal,
        totalMonthlyPayment,
        thisMonth,
        goalStats,
        habitStats,
      }}
      chart={{
        periodCompletionRate,
        chartData,
        chartBarColor,
        chartEmphasisColor,
        consistency,
      }}
    />
  )
}
