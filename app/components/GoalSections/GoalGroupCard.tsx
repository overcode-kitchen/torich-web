'use client'

import { Plus } from '@phosphor-icons/react'
import { GoalGroupItemRow } from './GoalGroupItemRow'
import { dDayLabel } from '@/app/utils/goal-format'
import type { Investment } from '@/app/types/investment'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalGroupCardProps {
  /** 목적. 미지정 카드는 null. */
  goal: Goal | null
  /** 미지정 카드일 때 헤더에 표시할 이름 (예: "목적 미지정") */
  fallbackName?: string
  progress?: GoalProgress
  records: Investment[]
  isPaid: (recordId: string) => boolean
  onTogglePaid: (record: Investment) => void
  onSelectRecord: (recordId: string) => void
  /** 목적 헤더 탭 → 목적 상세 (미지정 카드는 미전달) */
  onSelectGoal?: (goalId: string) => void
  /** 적립 항목 추가 (미지정 카드는 미전달) */
  onAddRecord?: (goalId: string) => void
}

/**
 * 목적 1개를 카드로 묶어 보여준다.
 * - 헤더: 목적 이름 + 진행률(있을 때) + D-day(있을 때), 탭 → 목적 상세
 * - 본문: 묶인 적립 항목 행들
 * - 푸터: 카드 하단에 붙는 회색 바 "적립 항목 추가" (보조 액션, 낮은 주목도)
 * goal이 null이면 "목적 미지정" 카드로 동작한다 (헤더 탭/추가 버튼 없음).
 */
export function GoalGroupCard({
  goal,
  fallbackName,
  progress,
  records,
  isPaid,
  onTogglePaid,
  onSelectRecord,
  onSelectGoal,
  onAddRecord,
}: GoalGroupCardProps) {
  const name = goal?.name ?? fallbackName ?? '목적 미지정'
  const dDay = dDayLabel(progress?.dDay ?? null)
  const percent = progress?.progressPercent ?? null

  const HeaderInner = (
    <>
      <h3 className="min-w-0 flex-1 truncate text-base font-bold text-foreground">
        {name}
      </h3>
      {dDay && (
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
          {dDay}
        </span>
      )}
      {percent !== null && (
        <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
          {percent}%
        </span>
      )}
    </>
  )

  return (
    <section className="overflow-hidden rounded-3xl bg-card">
      <div className="p-6 pb-4">
        {goal && onSelectGoal ? (
          <button
            type="button"
            onClick={() => onSelectGoal(goal.id)}
            className="mb-2 flex w-full items-center gap-3 text-left"
            aria-label={`${name} 목적 상세 보기`}
          >
            {HeaderInner}
          </button>
        ) : (
          <div className="mb-2 flex w-full items-center gap-3">{HeaderInner}</div>
        )}

        {records.length > 0 ? (
          <div>
            {records.map((record) => (
              <GoalGroupItemRow
                key={record.id}
                record={record}
                isPaid={isPaid(record.id)}
                onTogglePaid={onTogglePaid}
                onSelect={onSelectRecord}
              />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            아직 적립 항목이 없어요
          </p>
        )}
      </div>

      {goal && onAddRecord && (
        <button
          type="button"
          onClick={() => onAddRecord(goal.id)}
          className="flex w-full items-center justify-center gap-1.5 bg-muted/80 py-2 text-xs font-medium text-foreground-soft transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" weight="bold" />
          적립 항목 추가
        </button>
      )}
    </section>
  )
}
