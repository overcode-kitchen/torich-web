'use client'

import { useRouter } from 'next/navigation'
import MonthlyTrendSection from '@/app/components/StatsSections/MonthlyTrendSection'
import StatsEmptyCard from '@/app/components/StatsSections/StatsEmptyCard'
import type { StatsChart, StatsData, StatsFilter } from '@/app/components/StatsSections/stats-props'

interface StatsRecordTabProps {
  data: StatsData
  filter: StatsFilter
  chart: StatsChart
}

/**
 * 기록 탭 — "빠뜨리지 않았나".
 *
 * 기간 필터를 이 탭에만 두어 "필터가 무엇을 제어하는지"를 배치로 드러낸다.
 * 데이터가 적을 때의 안내는 MonthlyTrendSection이 자체적으로 처리한다.
 */
export default function StatsRecordTab({ data, filter, chart }: StatsRecordTabProps) {
  const router = useRouter()

  if (!data.hasRecords) {
    return (
      <StatsEmptyCard
        title="아직 투자 기록이 없어요"
        description="첫 투자를 등록하고 매달 적립을 챙겨보세요."
        actionLabel="첫 투자 등록하기"
        onAction={() => router.push('/add')}
      />
    )
  }

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <MonthlyTrendSection
        periodPreset={filter.periodPreset}
        setPeriodPreset={filter.setPeriodPreset}
        periodLabel={filter.periodLabel}
        customDateRange={filter.customDateRange}
        setCustomDateRange={filter.setCustomDateRange}
        handleCustomPeriod={filter.handleCustomPeriod}
        chartData={chart.chartData}
        chartBarColor={chart.chartBarColor}
        chartEmphasisColor={chart.chartEmphasisColor}
        consistency={chart.consistency}
      />
    </section>
  )
}
