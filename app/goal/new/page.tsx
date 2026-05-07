'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GoalFormSection } from '@/app/components/GoalFormSections/GoalFormSection'
import { useGoalForm } from '@/app/hooks/goal/add/useGoalForm'
import { useGoalCreate } from '@/app/hooks/goal/data/useGoalCreate'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

export default function NewGoalPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const { values, setField, isValid, toCreateInput } = useGoalForm()
  const { createGoal, isCreating } = useGoalCreate(userId)

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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">새 목적 만들기</h1>
        <p className="text-base text-muted-foreground">
          결혼자금·내 집 마련 같은 큰 목표를 한 곳에서 모아 관리해요.
        </p>
      </div>

      <GoalFormSection
        values={values}
        setField={setField}
        disabled={isCreating}
      />

      <div className="flex flex-col gap-3 pt-4">
        <Button
          size="lg"
          onClick={() => void handleSubmit()}
          disabled={!isValid || isCreating}
        >
          {isCreating ? '만드는 중…' : '목적 만들기'}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </div>
  )
}
