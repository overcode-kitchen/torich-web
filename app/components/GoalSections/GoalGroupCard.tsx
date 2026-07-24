'use client'

import Image from 'next/image'
import { Archive } from '@phosphor-icons/react'
import { GoalGroupItemRow } from './GoalGroupItemRow'
import { AddRecordDrawer } from './AddRecordDrawer'
import { resolvePurposeIcon } from '@/app/constants/goal'
import { dDayLabel } from '@/app/utils/goal-format'
import { DDayBadge } from '@/app/components/Common/DDayBadge'
import { nextSettlementDDay, type GoalStatus } from '@/app/utils/goal-status'
import type { MonthlyRecordStatus } from '@/app/hooks/payment/useMonthlyPaymentStatus'
import type { Investment } from '@/app/types/investment'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalGroupCardProps {
  /** 목적. 미지정 카드는 null. */
  goal: Goal | null
  /** 미지정 카드일 때 헤더에 표시할 이름 (예: "목적 미지정") */
  fallbackName?: string
  progress?: GoalProgress
  records: Investment[]
  /** record -> 이번 달 회차 진행 상태(completed/total, 다음 회차) */
  getStatus: (record: Investment) => MonthlyRecordStatus
  /** 이번 달 미룸 여부 */
  isPostponed: (recordId: string) => boolean
  onTogglePaid: (record: Investment) => void
  /** 이번 달 미룸 토글 */
  onTogglePostpone: (record: Investment) => void
  onSelectRecord: (recordId: string) => void
  /** 목적 헤더 탭 → 목적 상세 (미지정 카드는 미전달) */
  onSelectGoal?: (goalId: string) => void
  /** 적립 항목 추가 (미지정 카드는 미전달) */
  onAddRecord?: (goalId: string) => void
  /** 완료 목적을 보관함으로 옮긴다. 전달되고 status가 'completed'일 때만 보관 배너 노출. */
  onArchive?: (goalId: string) => void
  /** 파생 상태. 'pending_settlement'일 때 헤더에 "정산 대기" 배지 노출. */
  status?: GoalStatus
  /** 최상단 카드 등에서 손잡이에 관심 유도 넛지(띠용띠용)를 켠다. */
  nudge?: boolean
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
  getStatus,
  isPostponed,
  onTogglePaid,
  onTogglePostpone,
  onSelectRecord,
  onSelectGoal,
  onAddRecord,
  onArchive,
  status,
  nudge = false,
}: GoalGroupCardProps) {
  const name = goal?.name ?? fallbackName ?? '목적 미지정'
  const dDay = dDayLabel(progress?.dDay ?? null)
  const percent = progress?.progressPercent ?? null
  const icon = resolvePurposeIcon(goal?.emoji)
  const isPendingSettlement = status === 'pending_settlement'
  // 완료(기간 종료 포함) 목적: 적립 추가 유도는 접고, 카드 하단에 가벼운 "보관하기" 액션만 남긴다.
  const isCompletedGoal = status === 'completed'
  // 정산 대기: 가장 가까운 만기까지 D-day (없으면 배지에 D-day 미표시)
  const settlementLabel = isPendingSettlement
    ? dDayLabel(nextSettlementDDay(records, new Date()))
    : ''

  const HeaderInner = (
    <>
      {icon && (
        <Image
          src={icon.src}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
        />
      )}
      <h3 className="min-w-0 flex-1 truncate text-base font-bold text-foreground">
        {name}
      </h3>
      {isCompletedGoal ? (
        // 완료: 상태를 헤더가 먼저 선언한다. 달성이면 "완료", 미달 종료면 "기간 종료".
        // (D-day·%는 "연체/실패"처럼 읽혀 완료 톤과 어긋나므로 노출하지 않는다.)
        <span className="shrink-0 rounded-md bg-surface-hover px-2 py-0.5 text-[11px] font-semibold text-foreground-soft">
          {progress?.isCompleted ? '완료' : '기간 종료'}
        </span>
      ) : (
        <>
          {isPendingSettlement && (
            <span className="shrink-0 rounded-md bg-surface-hover px-2 py-0.5 text-[11px] font-semibold text-foreground-soft">
              정산 대기{settlementLabel && ` · ${settlementLabel}`}
            </span>
          )}
          {!isPendingSettlement && dDay && <DDayBadge label={dDay} />}
          {percent !== null && (
            <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
              {percent}%
            </span>
          )}
        </>
      )}
    </>
  )

  return (
    <div className="relative">
      <section className="relative z-10 overflow-hidden rounded-3xl bg-card">
        <div className="p-6 pb-4">
          {goal && onSelectGoal ? (
            <button
              type="button"
              onClick={() => onSelectGoal(goal.id)}
              className="mb-2 flex w-full items-center gap-1 text-left"
              aria-label={`${name} 목적 상세 보기`}
            >
              {HeaderInner}
            </button>
          ) : (
            <div className="mb-2 flex w-full items-center gap-1">{HeaderInner}</div>
          )}

          {records.length > 0 ? (
            <div>
              {records.map((record, idx) => (
                <GoalGroupItemRow
                  key={record.id}
                  record={record}
                  status={getStatus(record)}
                  isPostponed={isPostponed(record.id)}
                  onTogglePaid={onTogglePaid}
                  onTogglePostpone={onTogglePostpone}
                  onSelect={onSelectRecord}
                  isLast={idx === records.length - 1}
                  frozen={isCompletedGoal}
                />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              아직 적립 항목이 없어요
            </p>
          )}

          {isCompletedGoal && goal && onArchive && (
            <>
              {/* 상태는 헤더 pill이 말하므로 캡션은 생략, 하단엔 보관 액션만. */}
              <div aria-hidden className="mt-2 h-px bg-border-subtle-lighter" />
              <div className="flex items-center justify-end pt-3">
                <button
                  type="button"
                  onClick={() => onArchive(goal.id)}
                  className="flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground-soft transition-colors hover:text-foreground"
                >
                  <Archive className="h-4 w-4" weight="bold" />
                  보관하기
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {goal && onAddRecord && !isCompletedGoal && (
        <AddRecordDrawer
          goalId={goal.id}
          onAddRecord={onAddRecord}
          nudge={nudge}
        />
      )}
    </div>
  )
}
