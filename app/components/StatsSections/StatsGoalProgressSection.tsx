'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import { fmt, dDayLabel } from '@/app/utils/goal-format'
import type { Investment } from '@/app/types/investment'
import { createClient } from '@/utils/supabase/client'

export interface StatsGoalProgressSectionProps {
  records: Investment[]
}

export default function StatsGoalProgressSection({ records }: StatsGoalProgressSectionProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { goals } = useGoals(userId)
  const { completedPayments, retroactivePayments } = usePaymentHistory()

  const activeGoals = useMemo(
    () => goals.filter((g) => g.completed_at === null),
    [goals]
  )

  const progressMap = useGoalsProgress(
    activeGoals,
    records,
    completedPayments,
    retroactivePayments,
  )

  if (activeGoals.length === 0) return null

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-3">목표 진척</h2>
      <ul className="flex flex-col">
        {activeGoals.map((goal) => {
          const progress = progressMap.get(goal.id)
          if (!progress) return null
          const dDay = dDayLabel(progress.dDay)
          return (
            <li key={goal.id} className="border-b border-border-subtle last:border-b-0">
              <button
                type="button"
                onClick={() => router.push(`/goal/${goal.id}`)}
                className="flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <h3 className="min-w-0 truncate text-base font-semibold text-foreground">
                      {goal.name}
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">
                      현재 {fmt(progress.currentValue)}원 · {progress.progressPercent}%
                    </p>
                  </div>
                </div>
                {dDay && (
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {dDay}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
