'use client'

import Image from 'next/image'
import { Plus } from '@phosphor-icons/react'
import { GoalRow } from './GoalRow'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalCardCarouselProps {
  goals: Goal[]
  progressMap: Map<string, GoalProgress>
  onCreate: () => void
  onSelect: (id: string) => void
  onAddRecord: (id: string) => void
  onDelete?: (id: string) => Promise<void>
}

export function GoalCardCarousel({
  goals,
  progressMap,
  onCreate,
  onSelect,
  onAddRecord,
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
          <h2 className="text-lg font-bold text-foreground">내 목적</h2>
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
              onAddRecord={onAddRecord}
              onDelete={onDelete}
            />
          )
        })}
      </div>
    </section>
  )
}
