'use client'

import { useRouter } from 'next/navigation'
import ArrivalHeroSection from '@/app/components/StatsSections/ArrivalHeroSection'
import GoalPaceSection from '@/app/components/StatsSections/GoalPaceSection'
import StatsGoalProgressSection from '@/app/components/StatsSections/StatsGoalProgressSection'
import StatsEmptyCard from '@/app/components/StatsSections/StatsEmptyCard'
import { useGoalArrivals } from '@/app/hooks/stats/useGoalArrivals'
import type { StatsData, StatsPayment } from '@/app/components/StatsSections/stats-props'

/**
 * 목표 탭 — "언제 이뤄지나".
 *
 * 달성 예정 hero(가장 먼저 달성하는 목적 1개) → 목표별 페이스(전체) → 기한 없는 목적 순으로
 * 크게 → 자세히 내려간다.
 *
 * - hero: 기한+목표금액이 있는 목적 중 마감 임박 1위 — 달성 예정 월과 다음 행동
 * - 목표별 페이스: 같은 목록 **전부** — 달성% vs 지나온 시간%
 * - 기한 없는 목적: 시간축이 없어 페이스를 그릴 수 없는 목적 — 진척률만
 *
 * hero를 페이스 목록에서 빼지 않는다. 예전엔 중복을 피하려 뺐는데, 그러면 "목표별"이라는 이름과
 * 달리 하나가 사라져 비교가 안 되고, 목적이 하나뿐이면 페이스 섹션이 통째로 없어졌다.
 * 크게 하나를 보여주는 요약과 나란히 놓고 비교하는 목록은 역할이 다르다.
 * 마지막 카드의 조건은 여전히 arrivals의 정확한 여집합이라 빠지는 목적은 없다.
 */
export default function StatsGoalTab({
  data,
  payment,
}: {
  data: StatsData
  payment: StatsPayment
}) {
  const router = useRouter()
  const { records, hasRecords, goals } = data

  const arrivals = useGoalArrivals({
    goals,
    records,
    completedPayments: payment.completedPayments,
    retroactivePayments: payment.retroactivePayments,
    capturedAmounts: payment.capturedAmounts,
    postponedPayments: payment.postponedPayments,
  })

  const activeGoals = goals.filter((g) => g.completed_at === null)

  if (activeGoals.length === 0) {
    return hasRecords ? (
      <StatsEmptyCard
        title="아직 목적이 없어요"
        description={'무엇을 위해 모으는지 정하면\n언제쯤 이뤄지는지 알려드려요.'}
        actionLabel="목적 만들기"
        onAction={() => router.push('/goal/new')}
      />
    ) : (
      <StatsEmptyCard
        title="아직 적립 항목이 없어요"
        description="첫 적립 항목을 등록하고 매달 챙겨보세요."
        actionLabel="첫 적립 항목 등록하기"
        onAction={() => router.push('/add')}
      />
    )
  }

  // hero는 '아직 도착하지 않은' 목적 중 마감 임박 1위. 이미 목표를 채운 목적은 다음으로 넘긴다.
  const hero = arrivals.find((a) => !a.progress.isCompleted) ?? null

  return (
    <>
      {hero && <ArrivalHeroSection arrival={hero} />}
      <GoalPaceSection arrivals={arrivals} />
      <StatsGoalProgressSection records={records} />
      {arrivals.length === 0 && (
        <p className="pt-1 pb-4 text-center text-label text-muted-foreground">
          목적에 목표 금액과 마감일을 정하면 달성 시점을 알려드려요
        </p>
      )}
    </>
  )
}
