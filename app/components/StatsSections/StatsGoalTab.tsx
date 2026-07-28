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
 * 도착 예정 hero(가장 먼저 도착하는 목적 1개) → 목표별 페이스(나머지) → 기한 없는 목적 순으로
 * 크게 → 자세히 내려간다.
 *
 * 세 카드가 목적을 나눠 담당한다(겹치지 않게).
 * - hero: 기한+목표금액이 있는 목적 중 마감 임박 1위 — 도착 예정 월과 다음 행동
 * - 목표별 페이스: hero에 올라간 목적을 뺀 나머지 — 달성% vs 지나온 시간%
 * - 기한 없는 목적: 시간축이 없어 페이스를 그릴 수 없는 목적 — 진척률만
 *
 * 앞의 두 카드는 하나의 목록(useGoalArrivals)을 잘라 쓰고, 마지막 카드의 조건은 그 목록의 정확한
 * 여집합이라 목적이 두 번 나오거나 빠지는 일이 없다.
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
        title="아직 투자 기록이 없어요"
        description="첫 투자를 등록하고 매달 적립을 챙겨보세요."
        actionLabel="첫 투자 등록하기"
        onAction={() => router.push('/add')}
      />
    )
  }

  // hero는 '아직 도착하지 않은' 목적 중 마감 임박 1위. 이미 목표를 채운 목적은 다음으로 넘긴다.
  const hero = arrivals.find((a) => !a.progress.isCompleted) ?? null
  // hero에 올라간 목적은 페이스 목록에서 뺀다 — 같은 목적이 위아래로 두 번 나오지 않게
  const paceArrivals = hero ? arrivals.filter((a) => a.goal.id !== hero.goal.id) : arrivals

  return (
    <>
      {hero && <ArrivalHeroSection arrival={hero} />}
      <GoalPaceSection arrivals={paceArrivals} />
      <StatsGoalProgressSection records={records} />
      {arrivals.length === 0 && (
        <p className="pt-1 pb-4 text-center text-sm text-muted-foreground">
          목적에 목표 금액과 마감일을 정하면 도착 시점을 알려드려요
        </p>
      )}
    </>
  )
}
