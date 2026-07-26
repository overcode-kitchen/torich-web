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
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
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

  // 진입 직후 userId가 확정되기 전에는 저장이 조용히 실패하므로 CTA를 잠근다.
  // 앞 단계(A·B)는 userId와 무관하므로 마지막 단계에서만 잠근다.
  const isSaveBlocked = flow.isAtLastStep && !userId

  // 실패 시 반드시 토스트로 알린다. 적립 항목(useSavingsCashSubmit)과 동일한 문구를 쓴다.
  // createGoal은 실패하면 throw, userId 미확정이면 null을 반환하므로 두 경로를 모두 잡는다.
  const handleSubmit = useCallback(async (): Promise<void> => {
    try {
      const goal = await createGoal(toCreateInput())
      if (!goal) {
        toastError(TOAST_MESSAGES.updateSaveFailed)
        return
      }
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
    } catch {
      // 입력값은 유지한 채 재시도할 수 있게 화면을 그대로 둔다.
      toastError(TOAST_MESSAGES.updateSaveFailed)
    }
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
            disabled={!canAdvance || isSaveBlocked}
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
