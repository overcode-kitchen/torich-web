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
import { useGoalPresets } from '@/app/hooks/goal/data/useGoalPresets'
import { useGoalForm } from '@/app/hooks/goal/add/useGoalForm'
import { useGoalFlow } from '@/app/hooks/goal/add/useGoalFlow'
import { useGoalCreate } from '@/app/hooks/goal/data/useGoalCreate'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { useUnsavedChangesGuard } from '@/app/hooks/navigation/useUnsavedChangesGuard'
import { amountBucket, track } from '@/app/lib/analytics'
import { showErrorToast, toastError, TOAST_MESSAGES } from '@/app/utils/toast'
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
  const { values, setField, toCreateInput } = useGoalForm()
  const { presets } = useGoalPresets()
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
    const matched = presets.find((p) => p.name === preset)
    if (!matched) return
    setField('name', matched.name)
    setField('emoji', matched.iconKey)
  }, [searchParams, setField, presets])

  // 이탈 확인은 실제로 입력이 바뀐 뒤에만. preset으로 미리 채워진 값은 기준 스냅샷에 포함한다.
  const guard = useUnsavedChangesGuard({
    signature: JSON.stringify(values),
    deferBaseline: !!searchParams.get('preset'),
    onExit: goBack,
  })

  const hasTargetAmount = Number(values.target_amount) > 0

  // 필수는 이름뿐이다(useGoalForm.isValid와 같은 기준). 금액을 모른 채 시작하는 목적이
  // 많은데 여기서 막으면 그대로 이탈한다. 금액 미정은 0으로 저장되고 "미설정"으로 읽힌다.
  const canAdvance = useMemo<boolean>(() => {
    if (flow.currentStep === 'A') return values.name.trim().length > 0
    return true
  }, [flow.currentStep, values.name])

  // 값이 없는 B단계에서는 "다음으로"가 아니라 건너뛰어도 된다고 버튼이 직접 말한다.
  const ctaLabel = flow.isAtLastStep
    ? '저장하기'
    : flow.currentStep === 'B' && !hasTargetAmount
      ? '건너뛰기'
      : '다음으로'

  const { runWithoutGuard } = guard
  const handleSubmit = useCallback(async (): Promise<void> => {
    // createGoal은 실패를 throw로, 세션이 없으면 null로 알린다.
    // 둘 다 잡아서 알리지 않으면 화면이 그대로라 저장된 줄 알고 나가게 된다.
    try {
      const goal = await createGoal(toCreateInput())
      if (!goal) {
        toastError(TOAST_MESSAGES.goalSaveFailed)
        return
      }
      const trimmedName = values.name.trim()
      track('goal_create_success', {
        target_amount_bucket: amountBucket(Number(values.target_amount) || 0),
        // 금액 없이 만든 목적(bucket이 '<100k'로 뭉뚱그려짐)을 구분해서 본다.
        has_target_amount: Number(values.target_amount) > 0,
        has_deadline: !!values.target_date,
        has_external_amount: Number(values.external_amount) > 0,
        preset_used: presets.some((p) => p.name === trimmedName)
          ? trimmedName
          : 'custom',
      })
      router.replace('/')
    } catch (e) {
      showErrorToast(TOAST_MESSAGES.goalSaveFailed, e)
    }
  }, [createGoal, router, toCreateInput, values, presets])

  const handleAction = useCallback((): void => {
    if (isCreating) return
    if (flow.isAtLastStep) {
      // 저장은 스스로 화면을 옮기므로 감시 항목을 먼저 걷어내고 실행한다.
      void runWithoutGuard(handleSubmit)
      return
    }
    flow.goNextStep()
  }, [flow, handleSubmit, isCreating, runWithoutGuard])

  const handleBack = useCallback((): void => {
    if (flow.isAtFirstStep) {
      guard.requestExit()
      return
    }
    flow.goPrevStep()
  }, [flow, guard])

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
            label={ctaLabel}
            onClick={handleAction}
            disabled={!canAdvance}
            loading={isCreating}
            loadingLabel="저장 중..."
          />
        </div>
      </div>

      <ExitConfirmDialog
        isOpen={guard.isConfirmOpen}
        onClose={guard.cancelExit}
        onConfirm={guard.confirmExit}
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
