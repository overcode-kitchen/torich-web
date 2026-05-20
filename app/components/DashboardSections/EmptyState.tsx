'use client'

import { useRouter } from 'next/navigation'
import { Target } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { GOAL_PRESETS } from '@/app/constants/goal'
import { track } from '@/app/lib/analytics'

export default function EmptyState() {
  const router = useRouter()

  function goToNewGoal(preset?: string): void {
    track('goal_create_click', {
      entry_point: 'empty_state',
      preset: preset ?? 'none',
    })
    const query = preset ? `?preset=${encodeURIComponent(preset)}` : ''
    router.push(`/goal/new${query}`)
  }

  return (
    <div className="bg-card rounded-3xl p-10 flex flex-col items-center text-center gap-6">
      <div className="space-y-2">
        <p className="text-lg font-bold text-foreground">
          무엇을 위해 모으고 있나요?
        </p>
        <p className="text-sm text-muted-foreground">
          목적을 정하면 무엇을, 얼마나 모을지 한눈에 보여요.
        </p>
      </div>

      <Button
        size="lg"
        className="rounded-2xl shadow-lg"
        onClick={() => goToNewGoal()}
      >
        <Target className="w-5 h-5" />
        목적 만들기
      </Button>

      <div className="flex flex-wrap justify-center gap-2">
        {GOAL_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => goToNewGoal(preset.name)}
            className="inline-flex items-center gap-1 rounded-full border border-border-subtle-lighter bg-card px-3 py-1.5 text-xs font-medium text-foreground-soft hover:bg-muted transition-colors"
          >
            <span>{preset.emoji}</span>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
