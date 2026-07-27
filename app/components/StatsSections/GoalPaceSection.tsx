'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { dDayLabel } from '@/app/utils/goal-format'
import { DDayBadge } from '@/app/components/Common/DDayBadge'
import { AcornPhysicsFill } from '@/app/components/StatsSections/AcornPhysicsFill'
import { TiltToggle } from '@/app/components/StatsSections/TiltToggle'
import { TiltProvider } from '@/app/hooks/stats/useTiltGravity'
import type { Investment } from '@/app/types/investment'
import type { Goal } from '@/app/types/goal'
import { createClient } from '@/utils/supabase/client'

const clampPercent = (n: number) => Math.max(0, Math.min(100, n))

/**
 * 목적을 세운 시점(created_at)부터 마감일(target_date)까지 중 지금까지 흘러온 비율(%).
 * Goal에는 별도 시작일이 없어 created_at을 시계의 출발점으로 삼는다.
 */
function elapsedPercent(createdAt: string, targetDate: string): number {
  const start = new Date(createdAt).getTime()
  const end = new Date(targetDate).getTime()
  const total = end - start
  if (total <= 0) return 100
  return clampPercent(Math.round(((Date.now() - start) / total) * 100))
}

/** target_date → "2026.9월" */
function maturityLabel(targetDate: string): string {
  const d = new Date(targetDate)
  return `${d.getFullYear()}.${d.getMonth() + 1}월`
}

export interface GoalPaceSectionProps {
  records: Investment[]
}

/**
 * 목표별 페이스 — 기한 있는 목적(Goal)마다 "달성(모은 금액%) vs 기한(지나온 시간%)"을 나란히 대비.
 * 판정하지 않고 두 값을 보여줘, 시간 대비 빠른지 느린지는 사용자가 읽는다.
 * goalProgress(목적 진척)가 '얼마나 모았나'라면 이 섹션은 '시간 대비 페이스'를 답한다.
 * 스타일은 통계 페이지 형제 카드(목적 진척·자산)의 규칙(카드·헤더·DDayBadge·바·여백)에 맞춘다.
 */
export default function GoalPaceSection({ records }: GoalPaceSectionProps) {
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

  // 기한(target_date) + 목표금액이 있는 활성 목적만 — 페이스를 계산할 수 있는 대상.
  // 마감 임박순(가까운 target_date 먼저)으로 정렬한다.
  const paceGoals = useMemo(
    () =>
      goals
        .filter(
          (g): g is Goal & { target_date: string } =>
            g.completed_at === null && g.target_date !== null && g.target_amount > 0,
        )
        .sort(
          (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
        ),
    [goals],
  )

  const progressMap = useGoalsProgress(
    paceGoals,
    records,
    completedPayments,
    retroactivePayments,
    capturedAmounts,
  )

  if (paceGoals.length === 0) return null

  return (
    <TiltProvider>
      <section className="bg-card rounded-2xl p-5 mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground-muted">목표별 페이스</h2>
          <TiltToggle />
        </div>

        <ul className="flex flex-col">
        {paceGoals.map((goal, index) => {
          const progress = progressMap.get(goal.id)
          if (!progress) return null

          const achieved = progress.progressPercent ?? 0
          const elapsed = elapsedPercent(goal.created_at, goal.target_date)
          const dday = dDayLabel(progress.dDay)

          return (
            <li key={goal.id} className="border-b border-border-subtle last:border-b-0">
              <button
                type="button"
                onClick={() => router.push(`/goal/detail?id=${goal.id}`)}
                className="w-full py-4 px-1 text-left"
              >
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="min-w-0 truncate text-lg font-semibold text-foreground">
                    {goal.name}
                  </h3>
                  {dday && <DDayBadge label={dday} />}
                </div>

                {/* 좌: 달성(도토리 더미) · 우: 기한(회색 바) + 만기 */}
                <div className="grid grid-cols-[1fr_1.25fr] gap-2.5">
                  <div className="relative min-h-[84px] overflow-hidden rounded-xl bg-acorn-well-bg px-3 py-3">
                    <AcornPhysicsFill level={clampPercent(achieved)} seed={index + 1} />
                    <div className="relative">
                      <div className="text-xs font-bold text-success">달성</div>
                      <div className="mt-1 text-2xl font-bold leading-none tracking-tight text-success tabular-nums">
                        {achieved}
                        <span className="ml-0.5 text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-[84px] flex-col justify-center gap-2 rounded-xl border border-card-border px-3 py-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-foreground-muted">기한</span>
                      <span className="text-sm font-bold text-foreground-soft tabular-nums">
                        {elapsed}%
                        <span className="ml-0.5 text-[10px] font-medium text-foreground-muted">지남</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-foreground-subtle transition-all duration-500"
                        style={{ width: `${elapsed}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-semibold text-foreground-subtle">
                      {maturityLabel(goal.target_date)} 만기
                    </div>
                  </div>
                </div>
              </button>
            </li>
          )
        })}
        </ul>
      </section>
    </TiltProvider>
  )
}
