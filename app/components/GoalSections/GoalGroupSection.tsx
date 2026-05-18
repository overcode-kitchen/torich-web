'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import { GoalGroupCard } from './GoalGroupCard'
import { MonthlySummaryBar } from './MonthlySummaryBar'
import { useGoalGroups } from '@/app/hooks/goal/data/useGoalGroups'
import { useMonthlyPaymentStatus } from '@/app/hooks/payment/useMonthlyPaymentStatus'
import { track } from '@/app/lib/analytics'
import type { Investment } from '@/app/types/investment'

export interface GoalGroupSectionProps {
  records: Investment[]
}

/**
 * 홈 메인 영역: 목적 그룹 카드 묶음.
 *
 * - userId는 useGoalGroups가 자체적으로 supabase.auth에서 가져온다.
 *   (Dashboard.tsx 162줄 한도 초과 → props 추가 금지)
 * - 목적마다 GoalGroupCard 1개, goal_id 없는 투자는 "목적 미지정" 카드 1개.
 * - 맨 위 이번 달 요약 + 맨 아래 "목적 만들기" CTA.
 * - 목적·투자가 모두 0개면 아무것도 그리지 않는다(상위 EmptyState가 담당).
 */
export default function GoalGroupSection({ records }: GoalGroupSectionProps) {
  const router = useRouter()
  const { groups, unassignedRecords, isLoading } = useGoalGroups(records)
  const { isCompleted, toggle } = useMonthlyPaymentStatus()

  const summary = useMemo(() => {
    const total = records.length
    const completed = records.filter((r) => isCompleted(r.id)).length
    return { total, completed }
  }, [records, isCompleted])

  if (isLoading) return null
  if (groups.length === 0 && records.length === 0) return null

  return (
    <div className="space-y-4">
      <MonthlySummaryBar completed={summary.completed} total={summary.total} />

      {groups.map(({ goal, progress, records: groupRecords }) => (
        <GoalGroupCard
          key={goal.id}
          goal={goal}
          progress={progress}
          records={groupRecords}
          isPaid={isCompleted}
          onTogglePaid={toggle}
          onSelectRecord={(id) => router.push(`/investment?id=${id}`)}
          onSelectGoal={(id) => router.push(`/goal/${id}`)}
          onAddRecord={(id) => router.push(`/add?goalId=${id}`)}
        />
      ))}

      {unassignedRecords.length > 0 && (
        <GoalGroupCard
          goal={null}
          fallbackName="목적 미지정"
          records={unassignedRecords}
          isPaid={isCompleted}
          onTogglePaid={toggle}
          onSelectRecord={(id) => router.push(`/investment?id=${id}`)}
        />
      )}

      <button
        type="button"
        onClick={() => {
          track('goal_add_click', { entry_point: 'dashboard_group' })
          router.push('/goal/new')
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border-subtle-lighter bg-card py-3.5 text-sm font-medium text-foreground-soft transition-colors hover:bg-muted hover:text-foreground"
      >
        <Plus className="h-4 w-4" weight="bold" />
        목적 만들기
      </button>
    </div>
  )
}
