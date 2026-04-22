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

function formatDaysLeft(daysLeft: number): string {
  if (daysLeft > 0) return `D-${daysLeft}`
  if (daysLeft === 0) return '오늘 만기'
  return `만기 지남 (+${-daysLeft}일)`
}

/**
 * 통계 화면 — 목표형/적립형 혼재 시 투자 상태 요약(Health Check).
 * 단일 모드일 때는 중복이라 숨김.
 */
export default function ModeBreakdownSection({ goalStats, habitStats }: ModeBreakdownSectionProps) {
  const hasGoal = goalStats.count > 0
  const hasHabit = habitStats.count > 0

  if (!hasGoal || !hasHabit) return null

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-4">투자 상태 요약</h2>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-foreground-soft" weight="bold" />
            <span className="text-sm font-semibold text-foreground">목표형 투자 ({goalStats.count}개)</span>
          </div>
          <dl className="space-y-2">
            {goalStats.nextMaturityItem && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-muted-foreground shrink-0">가장 빠른 만기</dt>
                <dd className="text-sm font-medium text-foreground text-right truncate">
                  {formatMaturityLabel(goalStats.nextMaturityItem.endDate)} ·{' '}
                  <span className="text-foreground-soft">{goalStats.nextMaturityItem.title}</span>
                  <span className="text-muted-foreground font-normal"> · {formatDaysLeft(goalStats.nextMaturityItem.daysLeft)}</span>
                </dd>
              </div>
            )}
            {goalStats.lowestProgressItem && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-muted-foreground shrink-0">진행률 가장 낮음</dt>
                <dd className="text-sm font-medium text-foreground text-right truncate">
                  <span className="text-foreground-soft">{goalStats.lowestProgressItem.title}</span>
                  <span className="text-muted-foreground font-normal"> · {goalStats.lowestProgressItem.progressPercent}%</span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-foreground-soft" weight="bold" />
            <span className="text-sm font-semibold text-foreground">적립형 투자 ({habitStats.count}개)</span>
          </div>
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-muted-foreground shrink-0">이번 달 납입</dt>
              <dd className="text-sm font-medium text-foreground text-right">
                {habitStats.thisMonthTotalCount > 0 ? (
                  <>
                    {habitStats.thisMonthCompletedCount}/{habitStats.thisMonthTotalCount} 완료
                  </>
                ) : (
                  <span className="text-foreground-soft font-normal">이번 달 예정 없음</span>
                )}
              </dd>
            </div>
            {habitStats.longestHabitItem && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-muted-foreground shrink-0">가장 오래 쌓음</dt>
                <dd className="text-sm font-medium text-foreground text-right truncate">
                  <span className="text-foreground-soft">{habitStats.longestHabitItem.title}</span>
                  <span className="text-muted-foreground font-normal"> · {habitStats.longestHabitItem.elapsedMonths}개월</span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  )
}
