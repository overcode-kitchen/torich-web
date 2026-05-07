'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GoalLifecycleSection } from '@/app/components/GoalDetailSections/GoalLifecycleSection'
import { GoalProgressSection } from '@/app/components/GoalDetailSections/GoalProgressSection'
import { LinkedRecordsSection } from '@/app/components/GoalDetailSections/LinkedRecordsSection'
import { UnlinkedRecordsSection } from '@/app/components/GoalDetailSections/UnlinkedRecordsSection'
import { useGoalProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useInvestmentGoalLink } from '@/app/hooks/goal/data/useInvestmentGoalLink'
import { useGoalDetail } from '@/app/hooks/goal/detail/useGoalDetail'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { goal, records, unlinkedRecords, isLoading, refetch, setGoal } =
    useGoalDetail(params?.id, userId)
  const progress = useGoalProgress(goal, records)
  const { updateGoal, archiveGoal, isUpdating } = useGoalUpdate(userId)
  const { linkRecordToGoal, isLinking } = useInvestmentGoalLink(userId)

  // completed_at 1회 자동 기록 (현재값이 처음 target_amount 도달 시)
  useEffect(() => {
    if (!goal || !progress) return
    if (goal.completed_at === null && progress.isCompleted) {
      void updateGoal(goal.id, {
        completed_at: new Date().toISOString(),
      }).then((updated) => {
        if (updated) setGoal(updated)
      })
    }
  }, [goal, progress, updateGoal, setGoal])

  async function handleArchive(): Promise<void> {
    if (!goal) return
    const confirmed = window.confirm(
      `"${goal.name}"을(를) 정리할까요? 묶였던 투자는 자유 상태로 돌아갑니다.`,
    )
    if (!confirmed) return
    await archiveGoal(goal.id)
    router.push('/')
  }

  async function handleLink(recordId: string): Promise<void> {
    if (!goal) return
    await linkRecordToGoal(recordId, goal.id)
    await refetch()
  }

  async function handleUnlink(recordId: string): Promise<void> {
    await linkRecordToGoal(recordId, null)
    await refetch()
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-md p-6 text-base text-muted-foreground">
        불러오는 중…
      </div>
    )
  }

  if (!goal || !progress) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-6">
        <p className="text-base text-muted-foreground">
          목적을 찾을 수 없습니다.
        </p>
        <Button onClick={() => router.push('/')}>홈으로</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        {goal.emoji ? <span className="text-3xl">{goal.emoji}</span> : null}
        <h1 className="text-3xl font-semibold tracking-tight">{goal.name}</h1>
      </div>

      <GoalProgressSection goal={goal} progress={progress} />

      <LinkedRecordsSection
        records={records}
        isLinking={isLinking}
        onUnlink={(id) => void handleUnlink(id)}
      />

      <UnlinkedRecordsSection
        records={unlinkedRecords}
        isLinking={isLinking}
        onLink={(id) => void handleLink(id)}
      />

      <GoalLifecycleSection
        goal={goal}
        progress={progress}
        isArchiving={isUpdating}
        onArchive={handleArchive}
      />
    </div>
  )
}
