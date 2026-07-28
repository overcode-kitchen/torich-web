'use client'

import { useRouter } from 'next/navigation'
import GoalPaceSection from '@/app/components/StatsSections/GoalPaceSection'
import StatsGoalProgressSection from '@/app/components/StatsSections/StatsGoalProgressSection'
import StatsEmptyCard from '@/app/components/StatsSections/StatsEmptyCard'
import { hasArrivalEstimate } from '@/app/utils/goal-scope'
import type { StatsData } from '@/app/components/StatsSections/stats-props'

/**
 * 목표 탭 — "언제 이뤄지나".
 *
 * 두 카드가 목적을 나눠 담당한다(겹치지 않게).
 * - 목표별 페이스: 기한+목표금액이 있는 목적 — 달성% vs 지나온 시간%
 * - 기한 없는 목적: 시간축이 없어 페이스를 그릴 수 없는 목적 — 진척률만
 *
 * 두 조건은 서로 정확한 여집합이라 목적이 두 번 나오거나 빠지는 일이 없다.
 */
export default function StatsGoalTab({ data }: { data: StatsData }) {
  const router = useRouter()
  const { records, hasRecords, goals } = data

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

  // 목적은 있는데 전부 기한이 없으면 페이스 카드가 스스로 null을 렌더하고 진척 카드만 남는다.
  const hasPaceGoal = activeGoals.some(hasArrivalEstimate)

  return (
    <>
      <GoalPaceSection records={records} />
      <StatsGoalProgressSection records={records} />
      {!hasPaceGoal && (
        <p className="pt-1 pb-4 text-center text-sm text-muted-foreground">
          목적에 목표 금액과 마감일을 정하면 도착 시점을 알려드려요
        </p>
      )}
    </>
  )
}
