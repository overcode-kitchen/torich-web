'use client'

import type { ReactNode } from 'react'
import { Target, Flame, Check, Clock, Warning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type {
  GoalStats,
  HabitStats,
  InvestmentItemStat,
  MonthPaymentStatus,
} from '@/app/hooks/investment/calculations/useStatsCalculations'

interface ModeBreakdownSectionProps {
  goalStats: GoalStats
  habitStats: HabitStats
}

/** 이번 달 납입 상태 배지 — 급함(미납)만 색으로 신호, 나머지는 차분하게. */
function StatusBadge({ status }: { status: MonthPaymentStatus }) {
  const base = 'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold'
  switch (status.kind) {
    case 'done':
      return (
        <span className={cn(base, 'bg-success/10 text-success')}>
          <Check className="h-3 w-3" weight="bold" />
          완료
        </span>
      )
    case 'overdue':
      return (
        <span className={cn(base, 'bg-destructive/10 text-destructive')}>
          <Warning className="h-3 w-3" weight="bold" />
          {status.day}일 미납
        </span>
      )
    case 'due':
      return (
        <span className={cn(base, 'bg-surface-hover text-foreground-soft')}>
          <Clock className="h-3 w-3" weight="bold" />
          {status.day}일 예정
        </span>
      )
    case 'none':
      return <span className={cn(base, 'text-foreground-subtle')}>예정 없음</span>
  }
}

/** 항목 오른쪽 보조 지표 — 목표형은 만기까지 실납입 회차, 적립형은 누적 납입 개월. */
function progressLabel(item: InvestmentItemStat): string | null {
  if (item.totalMonths != null) {
    const paid = Math.min(item.paidMonths, item.totalMonths)
    return `${paid}/${item.totalMonths}회차`
  }
  return item.paidMonths > 0 ? `${item.paidMonths}회 납입` : null
}

function ItemRow({ item }: { item: InvestmentItemStat }) {
  const label = progressLabel(item)
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="min-w-0 truncate text-sm text-foreground">{item.title}</span>
      <span className="flex shrink-0 items-center gap-2">
        {label && <span className="text-xs tabular-nums text-muted-foreground">{label}</span>}
        <StatusBadge status={item.monthStatus} />
      </span>
    </li>
  )
}

interface ModeBlockProps {
  icon: ReactNode
  title: string
  count: number
  dueCount: number
  doneCount: number
  items: InvestmentItemStat[]
}

function ModeBlock({ icon, title, count, dueCount, doneCount, items }: ModeBlockProps) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-foreground">
          {title} {count}개
        </span>
        {dueCount > 0 && (
          <span className="ml-auto text-xs font-medium text-muted-foreground">
            이번 달 {doneCount}/{dueCount} 챙김
          </span>
        )}
      </div>
      <ul className="divide-y divide-border-subtle-lighter">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  )
}

/**
 * 통계 화면 — 투자 상태 요약.
 * 대표값을 뽑는 대신 항목마다 이번 달 납입 상태(완료/예정/미납)를 배지로 보여준다.
 * 목표형은 만기까지 실제 낸 회차, 적립형은 누적 납입 개월을 함께 표기.
 * 한 종류만 있어도 그 종류 블록은 노출한다.
 */
export default function ModeBreakdownSection({ goalStats, habitStats }: ModeBreakdownSectionProps) {
  const hasGoal = goalStats.count > 0
  const hasHabit = habitStats.count > 0

  if (!hasGoal && !hasHabit) return null

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-4">투자 상태 요약</h2>

      <div className="grid grid-cols-1 gap-4">
        {hasGoal && (
          <ModeBlock
            icon={<Target className="w-4 h-4 text-foreground-soft" weight="bold" />}
            title="목표형 투자"
            count={goalStats.count}
            dueCount={goalStats.thisMonthDueCount}
            doneCount={goalStats.thisMonthDoneCount}
            items={goalStats.items}
          />
        )}
        {hasHabit && (
          <ModeBlock
            icon={<Flame className="w-4 h-4 text-foreground-soft" weight="bold" />}
            title="적립형 투자"
            count={habitStats.count}
            dueCount={habitStats.thisMonthDueCount}
            doneCount={habitStats.thisMonthDoneCount}
            items={habitStats.items}
          />
        )}
      </div>
    </section>
  )
}
