'use client'

import { useRouter } from 'next/navigation'
import MonthlyTrendSection from '@/app/components/StatsSections/MonthlyTrendSection'
import StatsEmptyCard from '@/app/components/StatsSections/StatsEmptyCard'
import StreakHeroSection from '@/app/components/StatsSections/StreakHeroSection'
import { useLifetimeConsistency } from '@/app/hooks/stats/useLifetimeConsistency'
import type {
  StatsChart,
  StatsData,
  StatsFilter,
  StatsPayment,
} from '@/app/components/StatsSections/stats-props'

interface StatsRecordTabProps {
  data: StatsData
  payment: StatsPayment
  filter: StatsFilter
  chart: StatsChart
}

/**
 * 기록 탭 — "빠뜨리지 않았나".
 *
 * 연속 적립 hero(전체 기간) → 월별 통나무 차트(기간 필터) 순으로 크게 → 자세히 내려간다.
 * 기간 필터를 이 탭에만 두어 "필터가 무엇을 제어하는지"를 배치로 드러낸다.
 *
 * hero는 전체 기간, 차트는 선택 기간이라 기준이 다르다. 그래서 hero는 필터 위에 두고 차트와
 * 같은 카드에 섞지 않는다.
 */
export default function StatsRecordTab({ data, payment, filter, chart }: StatsRecordTabProps) {
  const router = useRouter()

  const lifetime = useLifetimeConsistency({
    activeRecords: data.activeRecords,
    completedPayments: payment.completedPayments,
    retroactivePayments: payment.retroactivePayments,
    postponedPayments: payment.postponedPayments,
  })

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
    <>
      <StreakHeroSection consistency={lifetime} />

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
    </>
  )
}
