'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useGoalDelete } from '@/app/hooks/goal/data/useGoalDelete'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { track } from '@/app/lib/analytics'
import ArchivedGoalsView from '@/app/components/SettingsSections/ArchivedGoalsView'

export default function ArchivedGoalsPage() {
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { archivedGoals, isLoading, refetch } = useGoals(userId)
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
      isLoading={isLoading}
      isBusy={isUpdating || isDeleting}
      onRestore={handleRestore}
      onDelete={handleDelete}
      onBack={goBack}
    />
  )
}
