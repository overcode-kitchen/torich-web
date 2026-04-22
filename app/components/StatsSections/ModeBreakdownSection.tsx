'use client'

import { Target, Flame } from '@phosphor-icons/react'
import type { GoalStats, HabitStats } from '@/app/hooks/investment/calculations/useStatsCalculations'

interface ModeBreakdownSectionProps {
  goalStats: GoalStats
  habitStats: HabitStats
}

function formatMaturityLabel(endDate: Date): string {
  return `${endDate.getFullYear()}년 ${endDate.getMonth() + 1}월`
}

/**
 * 통계 화면 - 목표형/적립형 분리 집계 섹션.
 * 두 모드가 모두 존재할 때만 렌더링한다 (단일 모드일 땐 중복 정보라서 숨김).
 */
export default function ModeBreakdownSection({ goalStats, habitStats }: ModeBreakdownSectionProps) {
  const hasGoal = goalStats.count > 0
  const hasHabit = habitStats.count > 0

  // 두 모드가 모두 있어야 의미가 있음
  if (!hasGoal || !hasHabit) return null

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-4">모드별 투자 요약</h2>

      <div className="grid grid-cols-1 gap-4">
        {/* 목표형 */}
        <div className="rounded-xl bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-foreground-soft" weight="bold" />
            <span className="text-sm font-semibold text-foreground">
              목표형 투자 ({goalStats.count}개)
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted-foreground">평균 진행률</dt>
              <dd className="text-base font-semibold text-foreground">
                {goalStats.averageProgress}%
              </dd>
            </div>
            {goalStats.nextMaturityItem && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-muted-foreground shrink-0">가장 빠른 만기</dt>
                <dd className="text-sm font-medium text-foreground text-right truncate">
                  {formatMaturityLabel(goalStats.nextMaturityItem.endDate)} ·{' '}
                  <span className="text-foreground-soft">{goalStats.nextMaturityItem.title}</span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* 적립형 */}
        <div className="rounded-xl bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-foreground-soft" weight="bold" />
            <span className="text-sm font-semibold text-foreground">
              적립형 투자 ({habitStats.count}개)
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted-foreground">평균 납입 기간</dt>
              <dd className="text-base font-semibold text-foreground">
                {habitStats.averageElapsedMonths}개월
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted-foreground">총 납입 원금</dt>
              <dd className="text-sm font-medium text-foreground">
                {habitStats.totalPaidPrincipal.toLocaleString()}원
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
