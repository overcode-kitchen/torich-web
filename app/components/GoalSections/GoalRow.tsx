'use client'

import { Plus, TrashSimple } from '@phosphor-icons/react'
import { useSwipeToDelete } from '@/app/hooks/ui/useSwipeToDelete'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import { fmt, dDayLabel } from '@/app/utils/goal-format'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalRowProps {
  goal: Goal
  progress: GoalProgress
  onSelect: (id: string) => void
  onAddRecord: (id: string) => void
  onDelete?: (id: string) => Promise<void>
}

export function GoalRow({
  goal,
  progress,
  onSelect,
  onAddRecord,
  onDelete,
}: GoalRowProps) {
  const dDay = dDayLabel(progress.dDay)
  const swipe = useSwipeToDelete({
    enabled: !!onDelete,
    onDelete: async () => {
      if (onDelete) await onDelete(goal.id)
    },
  })

  return (
    <>
      <div
        className="relative overflow-hidden border-b border-border-subtle last:border-b-0"
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
      >
        {onDelete && (
          <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-red-500">
            <button
              type="button"
              onClick={swipe.onDeleteButtonClick}
              className="flex flex-col items-center justify-center gap-1 w-full h-full"
              aria-label="삭제"
            >
              <TrashSimple className="w-5 h-5 text-white" weight="bold" />
              <span className="text-[11px] font-semibold text-white">삭제</span>
            </button>
          </div>
        )}

        <div
          className="relative flex items-center bg-card select-none"
          style={{
            transform: `translateX(${swipe.translateX}px)`,
            transition: swipe.isDragging
              ? 'none'
              : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (swipe.isRevealed) {
                swipe.close()
                return
              }
              onSelect(goal.id)
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="flex min-w-0 flex-1 items-center justify-between gap-3 px-2 py-2.5 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col gap-1.5">
                <h3 className="min-w-0 truncate text-base font-semibold text-foreground">
                  {goal.name}
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  현재 {fmt(progress.currentValue)}원
                  {progress.progressPercent !== null &&
                    ` · ${progress.progressPercent}%`}
                </p>
              </div>
            </div>
            {dDay && (
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {dDay}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onAddRecord(goal.id)}
            aria-label={`${goal.name}에 적립 항목 추가`}
            className="shrink-0 flex items-center justify-center w-9 h-9 mr-1 rounded-full text-foreground-soft hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" weight="bold" />
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={swipe.isDeleteModalOpen}
        onClose={swipe.onDeleteModalClose}
        onConfirm={swipe.onDeleteConfirm}
        isDeleting={swipe.isSubmitting}
        title={`'${goal.name}' 정리`}
        description="목적을 정리하면 묶였던 투자는 자유 상태로 돌아갑니다."
      />
    </>
  )
}
