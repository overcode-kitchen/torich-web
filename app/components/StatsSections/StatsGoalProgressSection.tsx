'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { fmt, dDayLabel } from '@/app/utils/goal-format'
import { hasArrivalEstimate } from '@/app/utils/goal-scope'
import { DDayBadge } from '@/app/components/Common/DDayBadge'
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
  const { completedPayments, retroactivePayments, capturedAmounts } = usePaymentHistoryContext()

  // 기한(+목표금액) 있는 목적은 '목표별 페이스'가 담당한다 — 여기서 제외해 같은 목적이 두 카드에
  // 두 번 나오지 않게 한다. 두 조건은 서로 여집합이라 빠지는 목적도 없다.
  const activeGoals = useMemo(
    () => goals.filter((g) => g.completed_at === null && !hasArrivalEstimate(g)),
    [goals]
  )

  const progressMap = useGoalsProgress(
    activeGoals,
    records,
    completedPayments,
    retroactivePayments,
    capturedAmounts,
  )

  if (activeGoals.length === 0) return null

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-2">기한 없는 목적</h2>
      <ul className="flex flex-col">
        {activeGoals.map((goal, index) => {
          const progress = progressMap.get(goal.id)
          if (!progress) return null
          const dDay = dDayLabel(progress.dDay)
          const percent = progress.progressPercent ?? 0
          const clamped = Math.max(0, Math.min(percent, 100))
          // 채움 끝에 앉는 토리가 바 양끝에서 잘리지 않도록 위치만 살짝 여며둔다
          const toryLeft = Math.max(4, Math.min(clamped, 96))
          // 항목마다 주기·시작점을 달리 줘 위/아래 토리가 서로 다른 박자로 움직이게 한다
          const beat = index % 3
          const waddleDuration = `${3.2 + beat * 0.6}s`
          const waddleDelay = `${-(beat * 1.1 + 0.4)}s`
          return (
            <li key={goal.id} className="border-b border-border-subtle last:border-b-0">
              <button
                type="button"
                onClick={() => router.push(`/goal/detail?id=${goal.id}`)}
                className="flex w-full flex-col gap-3.5 px-1 py-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="min-w-0 truncate text-lg font-semibold text-foreground">
                    {goal.name}
                  </h3>
                  {dDay && <DDayBadge label={dDay} />}
                </div>

                {/* 목표 금액이 없는 목적은 바를 그리지 않는다. 0%로 눕혀두면 모은 돈이
                    있어도 "제자리"로 읽혀, 목표를 안 정한 것과 못 모은 것이 뒤섞인다. */}
                {progress.progressPercent !== null && (
                  /* pt로 바 위에 토리 전용 여백을 확보해 위 텍스트와 겹치지 않게 한다 */
                  <div className="relative w-full pt-6">
                    {/* 채움 끝에 앉아 뚝·딱 스냅하며 뒤뚱거리는 토리 */}
                    <span
                      className="pointer-events-none absolute bottom-2 z-10 -translate-x-1/2"
                      style={{ left: `${toryLeft}%` }}
                      aria-hidden="true"
                    >
                      <Image
                        src="/images/tory_character_reverse.png"
                        alt=""
                        width={64}
                        height={64}
                        className="animate-tory-waddle h-auto w-8 select-none"
                        style={{ animationDuration: waddleDuration, animationDelay: waddleDelay }}
                      />
                    </span>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-progress-track"
                      role="progressbar"
                      aria-label={`${goal.name} 진행률`}
                      aria-valuenow={clamped}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${clamped}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="truncate text-sm text-muted-foreground">
                  {fmt(progress.currentValue)}원
                  {progress.progressPercent !== null
                    ? ` · ${progress.progressPercent}%`
                    : ' · 목표 미설정'}
                </p>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
