'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/app/lib/analytics'
import { shortWon } from '@/app/utils/goal-format'
import { arrivalHeroLine, arrivalMonthLabel, targetMonthLabel } from '@/app/utils/goal-arrival-copy'
import type { GoalArrival } from '@/app/utils/goal-arrival'

/**
 * 도착 예정 hero — 목표 탭에서 유일하게 미래를 말하는 카드.
 *
 * "46% 모았다"는 상태 보고지만 "2027년 3월 도착 예정 · 월 6만원을 더하면 목표일에 맞춰져요"는
 * 다음 행동이 붙은 피드백이다. 그래서 큰 숫자는 진행률이 아니라 도착 예정 월 하나다.
 *
 * 도토리 우물을 쓰지 않는다 — 3D·캐릭터 자산은 탭당 하나(목표 탭=도토리)이고 그 자리는 아래
 * 페이스 카드가 갖는다. hero는 텍스트와 회색 진행바로만 위계를 만든다.
 *
 * 카드 안의 모든 숫자는 이 목적 하나의 스코프다 — 전체 월 적립액 같은 값을 섞으면
 * "이 목적에 월 25만원"과 "월 60만원 적립 중"이 한 카드에서 부딪힌다.
 */
export default function ArrivalHeroSection({ arrival }: { arrival: GoalArrival }) {
  const router = useRouter()
  const { goal, progress } = arrival

  useEffect(() => {
    // 어떤 원인이 실제로 많은지 보고 다음 개선(목적 생성 시 목표금액·기한 정합성 검증)을 판단한다
    track('stats_arrival_view', { reason: arrival.reason })
    // 노출 1회만 — 값이 바뀔 때마다 다시 쏘지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const percent = Math.max(0, Math.min(progress.progressPercent ?? 0, 100))

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => {
          track('stats_arrival_tap')
          router.push(`/goal/detail?id=${goal.id}`)
        }}
        className="w-full rounded-2xl bg-card p-5 text-left"
      >
        <p className="text-xs font-bold text-foreground-muted">가장 먼저 도착</p>

        <div className="mt-1.5 flex min-w-0 items-baseline gap-1.5">
          {goal.emoji && <span className="shrink-0 text-sm">{goal.emoji}</span>}
          <h2 className="min-w-0 truncate text-[15px] font-bold tracking-tight text-foreground">
            {goal.name}
          </h2>
          <span className="shrink-0 text-xs font-semibold text-foreground-subtle">
            목표 {shortWon(goal.target_amount)}
          </span>
        </div>

        {/* 큰 숫자는 하나 — 도착 예정 월 */}
        {arrival.arrivalDate ? (
          <p className="mt-3 text-[26px] font-extrabold leading-none tracking-tight text-foreground tabular-nums">
            {arrivalMonthLabel(arrival.arrivalDate)}
            <span className="ml-1.5 text-sm font-bold text-foreground-muted">도착 예정</span>
          </p>
        ) : (
          <p className="mt-3 text-lg font-bold leading-snug tracking-tight text-foreground">
            도착 시점을 아직 알 수 없어요
          </p>
        )}

        {/* 통계 화면은 coolgray 위계 — 그린은 아래 도토리 우물 한 곳에만 준다 */}
        <div
          className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-progress-track"
          role="progressbar"
          aria-label={`${goal.name} 진행률`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-foreground-soft transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-xs text-foreground-muted">
            모은 금액{' '}
            <span className="font-bold text-foreground tabular-nums">
              {shortWon(progress.currentValue)}
            </span>
          </span>
          <span className="shrink-0 text-xs text-foreground-muted">
            목표일{' '}
            <span className="font-bold text-foreground tabular-nums">
              {targetMonthLabel(goal.target_date)}
            </span>
          </span>
        </div>

        {/* 상태(월 적립액)와 다음 행동을 한 줄로 — 카드당 설명 문장은 최대 1줄 */}
        <p className="mt-4 border-t border-border-subtle pt-3 text-xs leading-relaxed text-foreground-muted">
          {arrivalHeroLine(arrival)}
        </p>
      </button>
    </section>
  )
}
