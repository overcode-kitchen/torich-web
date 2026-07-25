'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers'
import { Button } from '@/components/ui/button'
import { GoalGroupCard } from './GoalGroupCard'
import { Sortable, useReorderSensors } from '@/app/components/Common/DragSortable'
import { UndoToastSection } from '@/app/components/CalendarSections/UndoToastSection'
import EmptyState from '@/app/components/DashboardSections/EmptyState'
import { useGoalGroups } from '@/app/hooks/goal/data/useGoalGroups'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useGoalDelete } from '@/app/hooks/goal/data/useGoalDelete'
import { useMonthlyPaymentStatus } from '@/app/hooks/payment/useMonthlyPaymentStatus'
import { track } from '@/app/lib/analytics'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import type { Goal } from '@/app/types/goal'
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
  const { groups, unassignedRecords, isLoading, userId, refetch, setGoals } =
    useGoalGroups(records)
  const { getStatus, isPostponed, toggle, togglePostpone, pendingUndo, handleUndo } =
    useMonthlyPaymentStatus()
  const { archiveGoal, reorderGoals } = useGoalUpdate(userId)
  const { deleteGoal, isDeleting } = useGoalDelete(userId)

  const sensors = useReorderSensors()
  // 드래그 직후 손을 뗄 때 뒤따르는 click(헤더 탭 → 상세 이동)을 삼킨다.
  const draggingRef = useRef<boolean>(false)

  function handleGoalDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = groups.map((g) => g.goal.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const newIds = arrayMove(ids, oldIndex, newIndex)
    // 낙관적: 활성 목적 순서를 새 순서로 재배치(archived는 별도 state라 영향 없음).
    setGoals((prev) => {
      const byId = new Map(prev.map((g) => [g.id, g]))
      return newIds
        .map((id) => byId.get(id))
        .filter((g): g is Goal => g !== undefined)
    })
    track('goal_reorder', { count: newIds.length })
    void reorderGoals(newIds).catch(() => {
      // 저장 실패 시 서버 순서로 되돌린다.
      toastError(TOAST_MESSAGES.updateSaveFailed)
      void refetch()
    })
  }

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={() => {
          draggingRef.current = true
        }}
        onDragCancel={() => {
          draggingRef.current = false
        }}
        onDragEnd={(event) => {
          handleGoalDragEnd(event)
          // click은 pointerup 직후 같은 태스크에서 발생하므로, 다음 태스크에서 해제해 삼킨다.
          setTimeout(() => {
            draggingRef.current = false
          }, 0)
        }}
      >
        <SortableContext
          items={groups.map((g) => g.goal.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {groups.map(({ goal, progress, records: groupRecords, status }) => (
              <Sortable key={goal.id} id={goal.id}>
                {({ setNodeRef, style, isDragging, handle }) => (
                  <div ref={setNodeRef} style={style}>
                    <GoalGroupCard
                      goal={goal}
                      progress={progress}
                      records={groupRecords}
                      status={status}
                      getStatus={getStatus}
                      isPostponed={isPostponed}
                      onTogglePaid={toggle}
                      onTogglePostpone={togglePostpone}
                      onSelectRecord={(id) => router.push(`/investment?id=${id}`)}
                      onSelectGoal={(id) => {
                        if (draggingRef.current) return
                        router.push(`/goal/detail?id=${id}`)
                      }}
                      onAddRecord={(id) => router.push(`/add?goalId=${id}`)}
                      onArchive={(id) => void handleArchive(id)}
                      onEditGoal={(id) => router.push(`/goal/detail/edit?id=${id}`)}
                      onDeleteGoal={handleDelete}
                      isDeleting={isDeleting}
                      dragHandle={handle}
                      isDragging={isDragging}
                    />
                  </div>
                )}
              </Sortable>
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
