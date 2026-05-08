'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CalendarBlank, CircleNotch } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import { GoalInfoSection } from '@/app/components/GoalDetailSections/GoalInfoSection'
import { GoalLifecycleSection } from '@/app/components/GoalDetailSections/GoalLifecycleSection'
import { GoalProgressSection } from '@/app/components/GoalDetailSections/GoalProgressSection'
import { LinkedRecordsSection } from '@/app/components/GoalDetailSections/LinkedRecordsSection'
import { UnlinkedRecordsSection } from '@/app/components/GoalDetailSections/UnlinkedRecordsSection'
import { useGoalProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useInvestmentGoalLink } from '@/app/hooks/goal/data/useInvestmentGoalLink'
import { useGoalDetail } from '@/app/hooks/goal/detail/useGoalDetail'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { formatFullDate } from '@/app/utils/date'
import { createClient } from '@/utils/supabase/client'

function dDayLabel(dDay: number | null): string {
  if (dDay === null) return ''
  if (dDay > 0) return `D-${dDay}`
  if (dDay === 0) return 'D-DAY'
  return `D+${Math.abs(dDay)}`
}

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { goal, records, unlinkedRecords, isLoading, refetch, setGoal } =
    useGoalDetail(params?.id, userId)
  const { completedPayments, retroactivePayments } = usePaymentHistory()
  const progress = useGoalProgress(
    goal,
    records,
    completedPayments,
    retroactivePayments,
  )
  const { updateGoal, archiveGoal, isUpdating } = useGoalUpdate(userId)
  const { linkRecordToGoal, isLinking } = useInvestmentGoalLink(userId)

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
      <SubPageScaffold onBack={goBack} surfaceClassName="bg-background" contentClassName="px-6 py-6">
        <div className="flex items-center justify-center py-16">
          <CircleNotch className="w-6 h-6 animate-spin text-foreground-subtle" />
        </div>
      </SubPageScaffold>
    )
  }

  if (!goal || !progress) {
    return (
      <SubPageScaffold onBack={goBack} surfaceClassName="bg-background" contentClassName="px-6 py-6">
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-sm text-foreground-subtle">
            목적을 찾을 수 없습니다.
          </p>
          <Button onClick={() => router.push('/')}>홈으로</Button>
        </div>
      </SubPageScaffold>
    )
  }

  return (
    <SubPageScaffold onBack={goBack} surfaceClassName="bg-background" contentClassName="px-6">
      {/* 제목 + 마감일 알림 */}
      <section className="py-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
            {goal.name}
          </h2>
          {progress.isCompleted && (
            <p className="text-sm font-medium text-green-600">
              목표 달성! 🎉
            </p>
          )}
        </div>
        {goal.target_date && (
          <Alert className="mt-1 border-none bg-primary/10 text-foreground px-4 py-3 rounded-2xl">
            <CalendarBlank className="w-5 h-5 text-primary" />
            <div className="flex items-baseline justify-between gap-4 col-start-2 w-full">
              <div>
                <AlertTitle className="text-sm font-medium text-foreground-soft">
                  마감일
                </AlertTitle>
                <AlertDescription className="mt-0.5 text-base font-semibold text-primary">
                  {dDayLabel(progress.dDay)} ·{' '}
                  {formatFullDate(new Date(goal.target_date))}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </section>

      <GoalProgressSection goal={goal} progress={progress} />

      <GoalInfoSection goal={goal} progress={progress} />

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
    </SubPageScaffold>
  )
}
