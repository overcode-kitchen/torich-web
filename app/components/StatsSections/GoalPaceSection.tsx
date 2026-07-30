'use client'

import { useRouter } from 'next/navigation'
import { dDayLabel, shortWon } from '@/app/utils/goal-format'
import { DDayBadge } from '@/app/components/Common/DDayBadge'
import { AcornPhysicsFill } from '@/app/components/StatsSections/AcornPhysicsFill'
import { TiltToggle } from '@/app/components/StatsSections/TiltToggle'
import { TiltProvider } from '@/app/hooks/stats/useTiltGravity'
import { arrivalMonthLabel } from '@/app/utils/goal-arrival-copy'
import type { GoalArrival } from '@/app/utils/goal-arrival'

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
  /** 도착 예정이 계산된 목적들 — hero에 올라간 목적은 호출측에서 빼고 넘긴다 */
  arrivals: GoalArrival[]
}

/**
 * 목표별 페이스 — 기한 있는 목적(Goal)마다 "달성(모은 금액%) vs 기한(지나온 시간%)"을 나란히 대비.
 * 판정하지 않고 두 값을 보여줘, 시간 대비 빠른지 느린지는 사용자가 읽는다.
 * goalProgress(목적 진척)가 '얼마나 모았나'라면 이 섹션은 '시간 대비 페이스'를 답한다.
 * 레이아웃은 목적 하나당 흰 카드 하나: 카드 머리에 목적명·D-day를 두고, 그 아래를 좌우로 나눠
 * 좌측 그린 패널이 도토리를 달성률만큼 쌓아 시각화를 맡고(달성% 오버레이), 우측이 모은 금액과
 * 기한(회색 바)·만기를 위아래로 벌려 채운다. 카드 밑단에는 도착 예정 한 줄을 얹는다.
 * 그린은 좌측 한 곳에만 강하게 주고 기한은 회색으로 눌러 "판정 없는 대비" 톤을 지킨다.
 */
export default function GoalPaceSection({ arrivals }: GoalPaceSectionProps) {
  const router = useRouter()

  if (arrivals.length === 0) return null

  return (
    <TiltProvider>
      <section className="mb-4">
        {/* 한 섹션이 카드 여러 장으로 쪼개지면 제목은 카드 밖에 둔다(FAQList와 같은 구조).
            한 섹션 = 한 카드인 다른 통계 섹션들이 제목을 카드 안에 두는 것과 같은 규칙이다. */}
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-foreground-muted">목표별 페이스</h2>
          <TiltToggle />
        </div>

        <ul className="flex flex-col gap-3">
        {arrivals.map((arrival, index) => {
          const { goal, progress } = arrival
          const achieved = progress.progressPercent ?? 0
          const elapsed = elapsedPercent(goal.created_at, goal.target_date)
          const dday = dDayLabel(progress.dDay)
          // 이미 목표를 채운 목적은 '달성 예정'이 성립하지 않고, 월 적립이 없으면 계산 자체가 안 된다
          const arrivalText = progress.isCompleted
            ? '목표 금액을 채웠어요'
            : arrival.arrivalDate
              ? arrivalMonthLabel(arrival.arrivalDate)
              : null

          return (
            <li key={goal.id}>
              <button
                type="button"
                onClick={() => router.push(`/goal/detail?id=${goal.id}`)}
                className="w-full rounded-2xl bg-card p-5 text-left"
              >
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="min-w-0 flex-1 truncate text-[17px] font-bold tracking-tight text-foreground">
                    {goal.name}
                  </h3>
                  {dday && <DDayBadge label={dday} />}
                </div>

                {/* 좌: 그린 패널(도토리가 달성률만큼 쌓임 + 달성%) · 우: 모은 금액 / 기한·만기 */}
                <div className="grid grid-cols-[118px_1fr] items-stretch gap-3.5">
                  <div className="goal-well relative isolate h-[118px] overflow-hidden rounded-2xl">
                    <AcornPhysicsFill level={clampPercent(achieved)} seed={index + 1} />
                    <div className="relative z-10 px-3 pt-3">
                      <div className="goal-well-label text-[11px] font-extrabold tracking-wide">달성</div>
                      <div className="goal-well-num mt-0.5 text-[34px] font-extrabold leading-none tracking-tight tabular-nums">
                        {achieved}
                        <span className="text-base">%</span>
                      </div>
                    </div>
                  </div>

                  {/* 위(모은 금액)와 아래(기한·만기)를 벌려 그린 패널 높이를 채운다 */}
                  <div className="flex min-w-0 flex-col justify-between py-0.5">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground-muted">모은 금액</div>
                      <div className="mt-1 truncate text-xl font-extrabold leading-tight tracking-tight text-foreground tabular-nums">
                        {shortWon(progress.currentValue)}
                        <span className="ml-1 text-xs font-semibold text-foreground-subtle">
                          / {shortWon(goal.target_amount)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="text-xs font-bold text-foreground-muted">기한</span>
                        <span className="text-sm font-bold text-foreground-soft tabular-nums">
                          {elapsed}%
                          <span className="ml-0.5 text-[10px] font-medium text-foreground-subtle">지남</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-progress-track">
                        <div
                          className="h-full rounded-full bg-foreground-subtle transition-all duration-500"
                          style={{ width: `${elapsed}%` }}
                        />
                      </div>
                      <div className="mt-2 text-[11px] font-semibold text-foreground-subtle">
                        {maturityLabel(goal.target_date)} 만기
                      </div>
                    </div>
                  </div>
                </div>

                {/* 새 카드가 아니라 기존 카드의 새 필드 — 달성 예정 한 줄.
                    계산할 수 없는 목적(월 적립 없음)은 줄을 아예 그리지 않는다. */}
                {arrivalText && (
                  <div className="mt-3.5 flex items-baseline justify-between gap-3 border-t border-border-subtle pt-3">
                    <span className="text-xs font-bold text-foreground-muted">
                      {progress.isCompleted ? '달성' : '달성 예정'}
                    </span>
                    <span className="min-w-0 truncate text-sm font-bold text-foreground tabular-nums">
                      {arrivalText}
                    </span>
                  </div>
                )}
              </button>
            </li>
          )
        })}
        </ul>
      </section>
    </TiltProvider>
  )
}
