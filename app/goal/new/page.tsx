'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CircleNotch } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import { GoalFormSection } from '@/app/components/GoalFormSections/GoalFormSection'
import { GOAL_PRESETS, GOAL_PRESET_NAMES } from '@/app/constants/goal'
import { useGoalForm } from '@/app/hooks/goal/add/useGoalForm'
import { useGoalCreate } from '@/app/hooks/goal/data/useGoalCreate'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { amountBucket, track } from '@/app/lib/analytics'
import { createClient } from '@/utils/supabase/client'

function NewGoalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // 빈 화면 예시 칩에서 넘어온 경우 목적 이름·이모지를 미리 채운다.
  useEffect(() => {
    const preset = searchParams.get('preset')
    if (!preset) return
    const matched = GOAL_PRESETS.find((p) => p.name === preset)
    if (!matched) return
    setField('name', matched.name)
    setField('emoji', matched.emoji)
  }, [searchParams, setField])

  async function handleSubmit(): Promise<void> {
    const goal = await createGoal(toCreateInput())
    if (!goal) return
    const trimmedName = values.name.trim()
    track('goal_create_success', {
      target_amount_bucket: amountBucket(Number(values.target_amount) || 0),
      has_deadline: !!values.target_date,
      has_external_amount: Number(values.external_amount) > 0,
      preset_used: GOAL_PRESET_NAMES.includes(trimmedName)
        ? trimmedName
        : 'custom',
    })
    // 목적을 만든 직후 적립 항목 추가로 바로 이어준다.
    router.replace(`/add?goalId=${goal.id}`)
  }

  return (
    <SubPageScaffold onBack={goBack} contentClassName="py-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground mb-3">
          새 목적 만들기
        </h1>
        <p className="text-sm text-foreground-subtle whitespace-pre-line">
          결혼자금·내 집 마련 같은 큰 목적을{'\n'}한 곳에서 모아 관리해요.
        </p>
      </div>

      <GoalFormSection
        values={values}
        setField={setField}
        disabled={isCreating}
        showOptionalFields={false}
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

export default function NewGoalPage() {
  return (
    <Suspense fallback={null}>
      <NewGoalContent />
    </Suspense>
  )
}
