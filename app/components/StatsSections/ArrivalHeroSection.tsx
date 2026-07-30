'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { track } from '@/app/lib/analytics'
import { resolvePurposeIcon } from '@/app/constants/goal'
import { shortWon } from '@/app/utils/goal-format'
import RotatingInsights from '@/app/components/StatsSections/RotatingInsights'
import {
  arrivalInsightLines,
  arrivalMonthLabel,
  monthlyContributionValue,
  targetMonthLabel,
} from '@/app/utils/goal-arrival-copy'
import type { GoalArrival } from '@/app/utils/goal-arrival'

/** 라벨 + 값 한 쌍. 값 넷을 문장 대신 2×2로 놓아 어느 줄도 접히지 않게 한다 */
function Stat({ label, value, alignRight }: { label: string; value: string; alignRight?: boolean }) {
  return (
    <div className={`flex min-w-0 items-baseline gap-1.5 ${alignRight ? 'justify-end' : ''}`}>
      <span className="shrink-0 text-xs text-foreground-muted">{label}</span>
      <span className="min-w-0 truncate text-xs font-bold text-foreground tabular-nums">
        {value}
      </span>
    </div>
  )
}

/**
 * 달성 예정 hero — 목표 탭에서 유일하게 미래를 말하는 카드.
 *
 * "46% 모았다"는 상태 보고지만 "2027년 3월 달성 예정 · 월 6만원 더하면 맞춰져요"는 다음 행동이
 * 붙은 피드백이다. 그래서 큰 숫자는 진행률이 아니라 달성 예정 월 하나다.
 *
 * 도토리 우물을 쓰지 않는다 — 3D·캐릭터 자산은 탭당 하나(목표 탭=도토리)이고 그 자리는 아래
 * 페이스 카드가 갖는다. 대신 목적 아이콘과 진행바로 hero임을 드러낸다.
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

  // goals.emoji에는 3D 아이콘 키(예: 'airplane')가 들어 있다 — 그대로 그리면 글자로 보인다
  const icon = resolvePurposeIcon(goal.emoji)
  const percent = Math.max(0, Math.min(progress.progressPercent ?? 0, 100))
  const remaining = Math.max(0, goal.target_amount - progress.currentValue)

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
        <p className="text-xs font-bold text-foreground-muted">가장 먼저 달성</p>

        <div className="mt-2 flex items-center gap-2">
          {icon && (
            <Image
              src={icon.src}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
          )}
          <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-foreground">
            {goal.name}
          </h2>
          <span className="shrink-0 text-xs font-semibold text-foreground-subtle tabular-nums">
            목표 {shortWon(goal.target_amount)}
          </span>
        </div>

        {/* 큰 숫자는 하나 — 달성 예정 월 */}
        {arrival.arrivalDate ? (
          <p className="mt-3 text-[26px] font-extrabold leading-none tracking-tight text-foreground tabular-nums">
            {arrivalMonthLabel(arrival.arrivalDate)}
            <span className="ml-1.5 text-sm font-bold text-foreground-muted">달성 예정</span>
          </p>
        ) : (
          <p className="mt-3 text-lg font-bold leading-snug tracking-tight text-foreground">
            달성 시점을 아직 알 수 없어요
          </p>
        )}

        <div
          className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-progress-track"
          role="progressbar"
          aria-label={`${goal.name} 진행률`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
          <Stat label="모은 금액" value={shortWon(progress.currentValue)} />
          <Stat label="목표일" value={targetMonthLabel(goal.target_date)} alignRight />
          <Stat label="월 적립" value={monthlyContributionValue(arrival)} />
          <Stat label="남은 금액" value={shortWon(remaining)} alignRight />
        </div>

        {/* 카드의 마지막 한 줄 = 다음 행동. 값들과 섞이지 않도록 헤어라인으로 끊는다.
            얼마 부족한지 → 뭘 하면 맞춰지는지 → 몇 번 더 넣으면 되는지를 한 줄에서 번갈아 돌린다. */}
        <div className="mt-3.5 border-t border-border-subtle pt-2.5">
          <RotatingInsights
            items={arrivalInsightLines(arrival)}
            className="truncate text-xs font-semibold text-foreground-soft"
          />
        </div>
      </button>
    </section>
  )
}
