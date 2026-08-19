'use client'

import { useAuth } from '@/app/hooks/auth/useAuth'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useGoalDelete } from '@/app/hooks/goal/data/useGoalDelete'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { track } from '@/app/lib/analytics'
import ArchivedGoalsView from '@/app/components/SettingsSections/ArchivedGoalsView'

export default function ArchivedGoalsPage() {
  // userId는 AuthProvider가 이미 들고 있는 값을 쓴다. getUser로 다시 받아오면 Auth 서버
  // 왕복이 끝나야 조회가 시작돼 화면이 직렬로 느려진다 (#93).
  const { user, isLoading: authLoading } = useAuth()
  const userId = user?.id

  const { archivedGoals, isLoading: goalsLoading, refetch } = useGoals(userId)
  const { unarchiveGoal, isUpdating } = useGoalUpdate(userId)
  const { deleteGoal, isDeleting } = useGoalDelete(userId)
  const { goBack } = useFlowBack({
    rootPath: '/settings',
    enableHistoryFallback: false,
  })

  async function handleRestore(id: string): Promise<void> {
    await unarchiveGoal(id)
    track('goal_restore', { entry_point: 'archive' })
    await refetch()
  }

  async function handleDelete(id: string): Promise<void> {
    await deleteGoal(id)
    track('goal_delete', { entry_point: 'archive' })
    await refetch()
  }

  return (
    <ArchivedGoalsView
      goals={archivedGoals}
      // authLoading을 포함해야 '아직 사용자를 모르는' 구간이 '보관한 목적 0개'로 보이지 않는다.
      isLoading={authLoading || goalsLoading}
      isBusy={isUpdating || isDeleting}
      onRestore={handleRestore}
      onDelete={handleDelete}
      onBack={goBack}
    />
  )
}
