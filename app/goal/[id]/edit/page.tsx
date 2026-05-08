'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import { GoalFormSection } from '@/app/components/GoalFormSections/GoalFormSection'
import { useGoalForm } from '@/app/hooks/goal/add/useGoalForm'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useGoalDetail } from '@/app/hooks/goal/detail/useGoalDetail'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import type { Goal } from '@/app/types/goal'

interface EditFormProps {
  goal: Goal
  userId: string | undefined
  onCancel: () => void
}

function EditForm({ goal, userId, onCancel }: EditFormProps) {
  const router = useRouter()
  const { values, setField, isValid, toCreateInput } = useGoalForm(goal)
  const { updateGoal, isUpdating } = useGoalUpdate(userId)

  async function handleSubmit(): Promise<void> {
    const updated = await updateGoal(goal.id, toCreateInput())
    if (updated) router.replace(`/goal/${goal.id}`)
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground mb-3">목적 다듬기</h1>
        <p className="text-sm text-foreground-subtle">
          이름·금액·마감일 등 언제든 자유롭게 바꿀 수 있어요.
        </p>
      </div>

      <GoalFormSection
        values={values}
        setField={setField}
        disabled={isUpdating}
        showOptionalFields
      />

      <div className="flex flex-col gap-3 pt-8">
        <button
          onClick={() => void handleSubmit()}
          disabled={!isValid || isUpdating}
          className="w-full bg-surface-dark text-white font-medium rounded-xl py-4 hover:bg-surface-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUpdating ? (
            <>
              <CircleNotch className="w-5 h-5 animate-spin" />
              <span>저장 중...</span>
            </>
          ) : (
            '저장하기'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className="w-full text-sm text-foreground-subtle py-2 hover:text-foreground transition-colors disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </>
  )
}

export default function EditGoalPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const { goBack } = useFlowBack({
    rootPath: params?.id ? `/goal/${params.id}` : '/',
    enableHistoryFallback: true,
  })

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { goal, isLoading } = useGoalDetail(params?.id, userId)

  if (isLoading) {
    return (
      <SubPageScaffold onBack={goBack} contentClassName="py-6">
        <div className="flex items-center justify-center py-16">
          <CircleNotch className="w-6 h-6 animate-spin text-foreground-subtle" />
        </div>
      </SubPageScaffold>
    )
  }

  if (!goal) {
    return (
      <SubPageScaffold onBack={goBack} contentClassName="py-6">
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
    <SubPageScaffold onBack={goBack} contentClassName="py-6">
      <EditForm goal={goal} userId={userId} onCancel={goBack} />
    </SubPageScaffold>
  )
}
