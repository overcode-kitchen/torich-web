'use client'

import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { GoalGroupCard } from './GoalGroupCard'
import { UndoToastSection } from '@/app/components/CalendarSections/UndoToastSection'
import EmptyState from '@/app/components/DashboardSections/EmptyState'
import { useGoalGroups } from '@/app/hooks/goal/data/useGoalGroups'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useGoalDelete } from '@/app/hooks/goal/data/useGoalDelete'
import { useMonthlyPaymentStatus } from '@/app/hooks/payment/useMonthlyPaymentStatus'
import { track } from '@/app/lib/analytics'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
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
 * - 맨 아래 "목적 만들기" CTA.
 * - 목적·투자가 모두 0개면 아무것도 그리지 않는다(상위 EmptyState가 담당).
 */
export default function GoalGroupSection({ records }: GoalGroupSectionProps) {
  const router = useRouter()
  const { groups, unassignedRecords, isLoading, userId, refetch } = useGoalGroups(records)
  const { getStatus, isPostponed, toggle, togglePostpone, pendingUndo, handleUndo } =
    useMonthlyPaymentStatus()
  const { archiveGoal } = useGoalUpdate(userId)
  const { deleteGoal, isDeleting } = useGoalDelete(userId)

  async function handleArchive(goalId: string): Promise<void> {
    await archiveGoal(goalId)
    track('goal_archive', { entry_point: 'home_card' })
    await refetch()
  }

  async function handleDelete(goalId: string): Promise<void> {
    try {
      await deleteGoal(goalId)
      track('goal_delete', { entry_point: 'home_card' })
      await refetch()
    } catch {
      // 실패 시 카드는 그대로 남는다. 원인을 알 수 있게 토스트로 알리고,
      // re-throw해 확인 모달이 닫히지 않게 한다(사용자가 다시 시도 가능).
      toastError(TOAST_MESSAGES.deleteFailed)
      throw new Error('goal delete failed')
    }
  }

  if (isLoading) return null
  // 목적·투자가 모두 없는 신규 사용자에게만 빈 화면을 보여준다.
  // (목적만 있고 투자가 없어도 목적 카드는 그려야 한다)
  if (groups.length === 0 && records.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      {groups.map(({ goal, progress, records: groupRecords, status }, index) => (
        <GoalGroupCard
          key={goal.id}
          goal={goal}
          progress={progress}
          records={groupRecords}
          status={status}
          getStatus={getStatus}
          isPostponed={isPostponed}
          onTogglePaid={toggle}
          onTogglePostpone={togglePostpone}
          onSelectRecord={(id) => router.push(`/investment?id=${id}`)}
          onSelectGoal={(id) => router.push(`/goal/detail?id=${id}`)}
          onAddRecord={(id) => router.push(`/add?goalId=${id}`)}
          onArchive={(id) => void handleArchive(id)}
          onEditGoal={(id) => router.push(`/goal/detail/edit?id=${id}`)}
          onDeleteGoal={handleDelete}
          isDeleting={isDeleting}
          nudge={groups.length > 1 && index === 0}
        />
      ))}

      {unassignedRecords.length > 0 && (
        <GoalGroupCard
          goal={null}
          fallbackName="목적 미지정"
          records={unassignedRecords}
          getStatus={getStatus}
          isPostponed={isPostponed}
          onTogglePaid={toggle}
          onTogglePostpone={togglePostpone}
          onSelectRecord={(id) => router.push(`/investment?id=${id}`)}
        />
      )}

      <Button
        size="lg"
        className="w-full rounded-2xl"
        onClick={() => {
          track('goal_add_click', { entry_point: 'dashboard_group' })
          router.push('/goal/new')
        }}
      >
        <Plus className="h-5 w-5" weight="bold" />
        목적 만들기
      </Button>

      <UndoToastSection
        pendingUndo={!!pendingUndo}
        handleUndo={() => void handleUndo()}
        label={pendingUndo?.label}
      />
    </div>
  )
}
