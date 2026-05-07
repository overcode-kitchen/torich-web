'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import { GoalFormSection } from '@/app/components/GoalFormSections/GoalFormSection'
import { useGoalForm } from '@/app/hooks/goal/add/useGoalForm'
import { useGoalCreate } from '@/app/hooks/goal/data/useGoalCreate'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { createClient } from '@/utils/supabase/client'

export default function NewGoalPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const { values, setField, isValid, toCreateInput } = useGoalForm()
  const { createGoal, isCreating } = useGoalCreate(userId)
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

  async function handleSubmit(): Promise<void> {
    const goal = await createGoal(toCreateInput())
    if (goal) router.push(`/goal/${goal.id}`)
  }

  return (
    <SubPageScaffold onBack={goBack} contentClassName="py-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground mb-3">
          새 목적 만들기
        </h1>
        <p className="text-sm text-foreground-subtle whitespace-pre-line">
          결혼자금·내 집 마련 같은 큰 목표를{'\n'}한 곳에서 모아 관리해요.
        </p>
      </div>

      <GoalFormSection
        values={values}
        setField={setField}
        disabled={isCreating}
      />

      <div className="flex flex-col gap-3 pt-8">
        <button
          onClick={() => void handleSubmit()}
          disabled={!isValid || isCreating}
          className="w-full bg-surface-dark text-white font-medium rounded-xl py-4 hover:bg-surface-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCreating ? (
            <>
              <CircleNotch className="w-5 h-5 animate-spin" />
              <span>만드는 중...</span>
            </>
          ) : (
            '목적 만들기'
          )}
        </button>
      </div>
    </SubPageScaffold>
  )
}
