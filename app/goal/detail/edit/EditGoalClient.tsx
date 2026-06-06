'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import PrimaryCTAButton from '@/app/components/PrimaryCTAButton'
import { GoalFormSection } from '@/app/components/GoalFormSections/GoalFormSection'
import MaturityMismatchConfirmModal from '@/app/components/Common/MaturityMismatchConfirmModal'
import { useGoalForm } from '@/app/hooks/goal/add/useGoalForm'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useGoalDetail } from '@/app/hooks/goal/detail/useGoalDetail'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import { detectMaturityMismatch } from '@/app/utils/goal-status'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import type { Goal, GoalCreateInput } from '@/app/types/goal'

interface EditFormProps {
  goal: Goal
  userId: string | undefined
  onCancel: () => void
}

function EditForm({ goal, userId, onCancel }: EditFormProps) {
  const router = useRouter()
  const { values, setField, isValid, toCreateInput } = useGoalForm(goal)
  const { updateGoal, isUpdating } = useGoalUpdate(userId)
  const { records } = useInvestmentsContext()
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)

  // 케이스 A 사전 안내: 새 종료일이 묶인 적금 만기보다 빠른지 검사.
  // 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
  const linkedRecords = useMemo(
    () => records.filter((r) => r.goal_id === goal.id),
    [records, goal.id],
  )
  const mismatch = useMemo(
    () => detectMaturityMismatch(values.target_date, linkedRecords),
    [values.target_date, linkedRecords],
  )

  async function doSubmit(override?: Partial<GoalCreateInput>): Promise<void> {
    const payload = { ...toCreateInput(), ...override }
    const updated = await updateGoal(goal.id, payload)
    if (updated) router.replace(`/goal/detail?id=${goal.id}`)
  }

  function handleSubmit(): void {
    if (mismatch) {
      setConfirmOpen(true)
      return
    }
    void doSubmit()
  }

  function handleProceed(): void {
    setConfirmOpen(false)
    void doSubmit()
  }

  function handleAlignDate(): void {
    if (!mismatch) return
    setField('target_date', mismatch.recordMaturityDate)
    setConfirmOpen(false)
    void doSubmit({ target_date: mismatch.recordMaturityDate })
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
        <PrimaryCTAButton
          label="저장하기"
          onClick={handleSubmit}
          disabled={!isValid}
          loading={isUpdating}
          loadingLabel="저장 중..."
        />
        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className="w-full text-sm text-foreground-subtle py-2 hover:text-foreground transition-colors disabled:opacity-50"
        >
          취소
        </button>
      </div>

      {mismatch && (
        <MaturityMismatchConfirmModal
          isOpen={confirmOpen}
          goalName={values.name.trim() || goal.name}
          goalTargetDate={values.target_date ?? ''}
          recordTitle={mismatch.recordTitle}
          recordMaturityDate={mismatch.recordMaturityDate}
          onProceed={handleProceed}
          onAlignDate={handleAlignDate}
          onCancel={() => setConfirmOpen(false)}
          isProcessing={isUpdating}
        />
      )}
    </>
  )
}

export default function EditGoalClient() {
  const searchParams = useSearchParams()
  const goalId = searchParams.get('id') ?? undefined
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const { goBack } = useFlowBack({
    rootPath: goalId ? `/goal/detail?id=${goalId}` : '/',
    enableHistoryFallback: true,
  })

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { goal, isLoading } = useGoalDetail(goalId, userId)

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
