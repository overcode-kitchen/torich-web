'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoalCardCarousel } from '@/app/components/GoalSections/GoalCardCarousel'
import { GoalEmptyCTA } from '@/app/components/GoalSections/GoalEmptyCTA'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import type { Investment } from '@/app/types/investment'
import { createClient } from '@/utils/supabase/client'

export interface GoalSectionProps {
  records: Investment[]
}

/**
 * 홈 상단 목적 영역 wrapper.
 *
 * ralplan 합의 핵심:
 * - Dashboard.tsx(162줄, 이미 한도 초과)에 goal 관련 props를 추가하지 않는다.
 * - userId는 자체적으로 supabase.auth에서 가져오고,
 *   records만 prop으로 받는다 (DashboardContent가 이미 records 보유).
 */
export default function GoalSection({ records }: GoalSectionProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { goals, isLoading, refetch } = useGoals(userId)
  const { archiveGoal } = useGoalUpdate(userId)
  const progressMap = useGoalsProgress(goals, records)

  async function handleDelete(id: string): Promise<void> {
    await archiveGoal(id)
    await refetch()
  }

  if (isLoading) return null

  if (goals.length === 0) {
    return <GoalEmptyCTA onCreate={() => router.push('/goal/new')} />
  }

  return (
    <GoalCardCarousel
      goals={goals}
      progressMap={progressMap}
      onCreate={() => router.push('/goal/new')}
      onSelect={(id) => router.push(`/goal/${id}`)}
      onDelete={handleDelete}
    />
  )
}
