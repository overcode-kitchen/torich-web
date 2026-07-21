'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import PrimaryCTAButton from '@/app/components/PrimaryCTAButton'
import ExitConfirmDialog from '@/app/components/AddItemSections/ExitConfirmDialog'
import GoalFlowHeader from '@/app/components/GoalFormSections/GoalFlowHeader'
import GoalStepName from '@/app/components/GoalFormSections/GoalStepName'
import GoalStepAmount from '@/app/components/GoalFormSections/GoalStepAmount'
import GoalStepDate from '@/app/components/GoalFormSections/GoalStepDate'
import { GOAL_PRESETS, GOAL_PRESET_NAMES } from '@/app/constants/goal'
import { useGoalForm } from '@/app/hooks/goal/add/useGoalForm'
import { useGoalFlow } from '@/app/hooks/goal/add/useGoalFlow'
import { useGoalCreate } from '@/app/hooks/goal/data/useGoalCreate'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { amountBucket, track } from '@/app/lib/analytics'
import { createClient } from '@/utils/supabase/client'

const STEP_COMPONENTS = {
  A: GoalStepName,
  B: GoalStepAmount,
  C: GoalStepDate,
} as const

function NewGoalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [exitDialogOpen, setExitDialogOpen] = useState<boolean>(false)
  const { values, setField, toCreateInput } = useGoalForm()
  const { createGoal, isCreating } = useGoalCreate(userId)
  const flow = useGoalFlow()
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
    setField('emoji', matched.iconKey)
  }, [searchParams, setField])

  const canAdvance = useMemo<boolean>(() => {
    if (flow.currentStep === 'A') return values.name.trim().length > 0
    if (flow.currentStep === 'B') return Number(values.target_amount) > 0
    return true
  }, [flow.currentStep, values.name, values.target_amount])

  const handleSubmit = useCallback(async (): Promise<void> => {
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
    router.replace('/')
  }, [createGoal, router, toCreateInput, values])

  const handleAction = useCallback((): void => {
    if (isCreating) return
    if (flow.isAtLastStep) {
      void handleSubmit()
      return
    }
    flow.goNextStep()
  }, [flow, handleSubmit, isCreating])

  const handleBack = useCallback((): void => {
    if (flow.isAtFirstStep) {
      setExitDialogOpen(true)
      return
    }
    flow.goPrevStep()
  }, [flow])

  return (
    <>
      <SubPageScaffold onBack={handleBack} contentClassName="py-6 pb-40">
        <GoalFlowHeader currentStep={flow.currentStep} />
        {(() => {
          const StepComponent = STEP_COMPONENTS[flow.currentStep]
          return (
            <StepComponent
              values={values}
              setField={setField}
              disabled={isCreating}
            />
          )
        })()}
      </SubPageScaffold>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface/95 backdrop-blur"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        <div className="mx-auto w-full max-w-md md:max-w-lg lg:max-w-2xl px-4 pt-4">
          <PrimaryCTAButton
            label={flow.isAtLastStep ? '저장하기' : '다음으로'}
            onClick={handleAction}
            disabled={!canAdvance}
            loading={isCreating}
            loadingLabel="저장 중..."
          />
        </div>
      </div>

      <ExitConfirmDialog
        isOpen={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        onConfirm={() => {
          setExitDialogOpen(false)
          goBack()
        }}
      />
    </>
  )
}

export default function NewGoalPage() {
  return (
    <Suspense fallback={null}>
      <NewGoalContent />
    </Suspense>
  )
}
