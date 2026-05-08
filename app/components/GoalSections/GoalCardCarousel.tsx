'use client'

import Image from 'next/image'
import { Plus, TrashSimple } from '@phosphor-icons/react'
import { useSwipeToDelete } from '@/app/hooks/ui/useSwipeToDelete'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalCardCarouselProps {
  goals: Goal[]
  progressMap: Map<string, GoalProgress>
  onCreate: () => void
  onSelect: (id: string) => void
  onDelete?: (id: string) => Promise<void>
}

function fmt(value: number): string {
  return value.toLocaleString('ko-KR')
}

function dDayLabel(dDay: number | null): string {
  if (dDay === null) return ''
  if (dDay > 0) return `D-${dDay}`
  if (dDay === 0) return 'D-DAY'
  return `D+${Math.abs(dDay)}`
}

interface GoalRowProps {
  goal: Goal
  progress: GoalProgress
  onSelect: (id: string) => void
  onDelete?: (id: string) => Promise<void>
}

function GoalRow({ goal, progress, onSelect, onDelete }: GoalRowProps) {
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
          className="relative bg-card select-none"
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
            className="flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col gap-1.5">
                <h3 className="min-w-0 truncate text-base font-semibold text-foreground">
                  {goal.name}
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  현재 {fmt(progress.currentValue)}원 ·{' '}
                  {progress.progressPercent}%
                </p>
              </div>
            </div>
            {dDay && (
              <div className="flex shrink-0 items-center">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {dDay}
                </span>
              </div>
            )}
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

export function GoalCardCarousel({
  goals,
  progressMap,
  onCreate,
  onSelect,
  onDelete,
}: GoalCardCarouselProps) {
  return (
    <section className="bg-card rounded-3xl p-6 pb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1">
          <Image
            src="/icons/3d/mountain(green).png"
            alt="목적 아이콘"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <h2 className="text-lg font-bold text-foreground">
            모아야 할 큰돈이 있나요?
          </h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          aria-label="목적 만들기"
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-foreground-soft hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus className="w-5 h-5" weight="bold" />
        </button>
      </div>

      <div>
        {goals.map((goal) => {
          const progress = progressMap.get(goal.id)
          if (!progress) return null
          return (
            <GoalRow
              key={goal.id}
              goal={goal}
              progress={progress}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          )
        })}
      </div>
    </section>
  )
}
