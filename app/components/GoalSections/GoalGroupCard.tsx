'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Archive } from '@phosphor-icons/react'
import { GoalGroupItemRow } from './GoalGroupItemRow'
import { AddRecordDrawer } from './AddRecordDrawer'
import GoalActionSheet from './GoalActionSheet'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import { useLongPress } from '@/app/hooks/ui/useLongPress'
import { resolvePurposeIcon } from '@/app/constants/goal'
import { dDayLabel } from '@/app/utils/goal-format'
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
  /** 헤더 롱프레스 → 액션 시트 "수정하기". 목적 수정 페이지로 이동. */
  onEditGoal?: (goalId: string) => void
  /** 헤더 롱프레스 → 액션 시트 "삭제하기" 확인 후 영구 삭제. */
  onDeleteGoal?: (goalId: string) => Promise<void>
  /** 삭제 진행 중 여부(확인 모달 버튼 로딩 표시용). */
  isDeleting?: boolean
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
  onEditGoal,
  onDeleteGoal,
  isDeleting = false,
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

  // 헤더 롱프레스 → 수정/보관/삭제 액션 시트. 관리 콜백이 하나라도 있을 때만 켠다.
  const canManage = !!goal && (!!onEditGoal || !!onArchive || !!onDeleteGoal)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)

  const longPress = useLongPress({
    onLongPress: () => setMenuOpen(true),
    onClick: () => {
      if (goal && onSelectGoal) onSelectGoal(goal.id)
    },
    enabled: canManage,
  })

  async function handleConfirmDelete(): Promise<void> {
    if (!goal || !onDeleteGoal) return
    await onDeleteGoal(goal.id)
    setDeleteModalOpen(false)
  }

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
          {!isPendingSettlement && dDay && (
            <span className="shrink-0 rounded-md bg-surface-hover px-2 py-0.5 text-[11px] font-semibold text-foreground-soft tabular-nums">
              {dDay}
            </span>
          )}
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
          {goal && (onSelectGoal || canManage) ? (
            <button
              type="button"
              className={`mb-2 flex w-full items-center gap-1 text-left${
                canManage ? ' select-none [-webkit-touch-callout:none]' : ''
              }`}
              aria-label={
                canManage
                  ? `${name} 목적 상세 보기 (길게 눌러 수정·삭제)`
                  : `${name} 목적 상세 보기`
              }
              {...(canManage
                ? longPress
                : { onClick: () => onSelectGoal?.(goal.id) })}
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

      {goal && canManage && (
        <>
          <GoalActionSheet
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            goalName={name}
            onEdit={() => {
              setMenuOpen(false)
              onEditGoal?.(goal.id)
            }}
            onArchive={
              // 보관은 완료(기간 종료 포함)된 목적만. 하단 보관 버튼과 동일 조건.
              onArchive && isCompletedGoal
                ? () => {
                    setMenuOpen(false)
                    onArchive(goal.id)
                  }
                : undefined
            }
            onDelete={() => {
              setMenuOpen(false)
              setDeleteModalOpen(true)
            }}
          />
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              if (!isDeleting) setDeleteModalOpen(false)
            }}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
            title="목적을 삭제할까요?"
            description="목적이 영구 삭제됩니다. 연결된 적립 항목은 삭제되지 않고 '목적 미지정'으로 남아요."
            confirmLabel="삭제"
            confirmingLabel="삭제 중..."
          />
        </>
      )}
    </div>
  )
}
