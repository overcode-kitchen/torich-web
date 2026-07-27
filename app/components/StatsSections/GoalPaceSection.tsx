'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { dDayLabel } from '@/app/utils/goal-format'
import { DDayBadge } from '@/app/components/Common/DDayBadge'
import type { Investment } from '@/app/types/investment'
import type { Goal } from '@/app/types/goal'
import { createClient } from '@/utils/supabase/client'

const clampPercent = (n: number) => Math.max(0, Math.min(100, n))

/** 인덱스 기반 의사난수(0~1). 리렌더에도 배치가 동일하도록 seed로 고정. */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

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

/** 도토리 한 알 (일러스트 — 캡=브라운, 몸통=탄). */
function Acorn({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 1.08} viewBox="0 0 24 26" aria-hidden="true">
      <rect x="11" y="2" width="2.2" height="3.4" rx="1.1" fill="#5C3E24" />
      <ellipse cx="12" cy="8" rx="8" ry="3.8" fill="#744F2F" />
      <path d="M4.4 8 Q12 27 19.6 8 Z" fill="#CDA067" />
      <ellipse cx="9" cy="13" rx="1.1" ry="1.6" fill="#E0BE8E" opacity="0.7" />
    </svg>
  )
}

/**
 * 달성률을 도토리 더미로 시각화 — 높이는 대략 level%, 정확한 값은 옆 숫자로.
 * 배치는 seed(목적 인덱스)+i로 고정해 리렌더에도 흔들리지 않는다.
 */
function AcornFill({ level, seed }: { level: number; seed: number }) {
  const count = Math.min(46, Math.max(2, Math.round(level * 0.5) + 2))
  const fillTop = Math.max(6, level) // 도토리가 흩어질 세로 상한(%)
  const acorns = Array.from({ length: count }, (_, i) => {
    const s = seed * 131 + i * 7
    return {
      key: i,
      size: 12 + pseudoRandom(s + 1) * 4,
      left: 3 + pseudoRandom(s + 2) * 82,
      bottom: pseudoRandom(s + 3) * fillTop,
      rot: -30 + pseudoRandom(s + 4) * 60,
    }
  })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {acorns.map((a) => (
        <span
          key={a.key}
          className="absolute"
          style={{ left: `${a.left}%`, bottom: `${a.bottom}%`, transform: `rotate(${a.rot}deg)` }}
        >
          <Acorn size={a.size} />
        </span>
      ))}
    </div>
  )
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
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-2">목표별 페이스</h2>

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
                  <div className="relative min-h-[84px] overflow-hidden rounded-xl bg-brand-accent-bg px-3 py-3">
                    <AcornFill level={clampPercent(achieved)} seed={index + 1} />
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
  )
}
