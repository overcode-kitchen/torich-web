'use client'

import { useEffect } from 'react'
import { useStatsData } from '@/app/hooks/investment/data/useStatsData'
import { usePeriodFilter } from '@/app/hooks/stats/usePeriodFilter'
import { useStatsCalculations } from '@/app/hooks/investment/calculations/useStatsCalculations'
import { useChartData } from '@/app/hooks/chart/useChartData'
import { useStatsPageUI } from '@/app/hooks/stats/useStatsPageUI'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import StatsView from '@/app/components/StatsSections/StatsView'
import { track } from '@/app/lib/analytics'

export default function StatsPage() {
  const { user, records, activeRecords, isLoading, router } = useStatsData()
  const { completedPayments, retroactivePayments, isLoading: historyLoading } = usePaymentHistory()

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
  } = useStatsCalculations({ records, activeRecords, completedPayments })

  const {
    monthlyRates,
    periodCompletionRate,
    chartData,
    chartBarColor,
  } = useChartData({ activeRecords, completedPayments, isCustomRange, effectiveMonths, customDateRange })

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
      }}
    />
  )
}
