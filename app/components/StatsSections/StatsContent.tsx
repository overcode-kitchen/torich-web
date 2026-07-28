'use client'

import { DetailTabs, type DetailTab } from '@/app/components/Common/DetailTabs'
import StatsGoalTab from '@/app/components/StatsSections/StatsGoalTab'
import StatsRecordTab from '@/app/components/StatsSections/StatsRecordTab'
import StatsMoneyTab from '@/app/components/StatsSections/StatsMoneyTab'
import { useStatsTabView, type StatsView } from '@/app/hooks/stats/useStatsTabView'
import { hasArrivalEstimate } from '@/app/utils/goal-scope'
import type { StatsContentProps } from '@/app/components/StatsSections/stats-props'

const STATS_TABS: DetailTab[] = [
  { key: 'goal', label: '목표' },
  { key: 'record', label: '기록' },
  { key: 'money', label: '모은 돈' },
]

/**
 * 통계 화면 본문 — 탭 하나에 질문 하나.
 *
 * 한 화면이 "언제 이뤄지나 / 빠뜨리지 않았나 / 얼마 모였나"에 동시에 답하려다 위계를 잃었던 것을
 * 탭으로 나눈다. 탭바는 투자·예적금 상세가 쓰는 DetailTabs를 그대로 재사용해 앱 전체 탭 문법을
 * 하나로 유지한다.
 */
export default function StatsContent({
  data,
  payment,
  ui,
  calculations,
  filter,
  chart,
}: StatsContentProps) {
  // 기본 탭은 '목표'. 단 도착 시점을 계산할 목적이 하나도 없으면 그 탭이 비므로 '기록'으로 연다.
  const hasDatedGoal = data.goals.some((g) => g.completed_at === null && hasArrivalEstimate(g))
  const { view, setView } = useStatsTabView(hasDatedGoal ? 'goal' : 'record')

  return (
    <>
      {/* 통계 본문은 px-4 → 같은 값으로 bleed해 구분선을 화면 폭까지 늘린다.
          DetailTabs 기본값(bg-background·top-0)을 통계 화면 기준(bg-surface·노치 아래)으로 덮는다. */}
      <DetailTabs
        tabs={STATS_TABS}
        activeTab={view}
        onTabClick={(tab) => setView(tab as StatsView)}
        bleedClassName="-mx-4 px-4 mb-4 bg-surface top-[calc(env(safe-area-inset-top,0px)+12px)]"
      />

      {view === 'goal' && <StatsGoalTab data={data} />}
      {view === 'record' && (
        <StatsRecordTab data={data} payment={payment} filter={filter} chart={chart} />
      )}
      {view === 'money' && <StatsMoneyTab data={data} ui={ui} calculations={calculations} />}
    </>
  )
}
