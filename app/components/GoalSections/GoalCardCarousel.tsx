'use client'

import { Plus } from '@phosphor-icons/react'
import { GoalCard } from './GoalCard'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalCardCarouselProps {
  goals: Goal[]
  progressMap: Map<string, GoalProgress>
  onCreate: () => void
  onSelect: (id: string) => void
}

export function GoalCardCarousel({
  goals,
  progressMap,
  onCreate,
  onSelect,
}: GoalCardCarouselProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="px-1 text-2xl font-semibold tracking-tight">내 목적</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {goals.map((goal) => {
          const progress = progressMap.get(goal.id)
          if (!progress) return null
          return (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progress}
              onClick={() => onSelect(goal.id)}
            />
          )
        })}
        <button
          type="button"
          onClick={onCreate}
          className="flex w-32 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <Plus size={28} weight="bold" />
          <span className="text-sm">새 목적</span>
        </button>
      </div>
    </section>
  )
}
