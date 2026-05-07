'use client'

import { Target } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export interface GoalEmptyCTAProps {
  onCreate: () => void
}

export function GoalEmptyCTA({ onCreate }: GoalEmptyCTAProps) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Target size={22} weight="bold" className="text-muted-foreground" />
        <h2 className="text-base font-semibold tracking-tight">
          첫 목적을 만들어보세요
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        결혼자금·내 집 마련 같은 큰 목표를 모으는 단위로 만들어보세요.
      </p>
      <Button size="sm" variant="outline" onClick={onCreate}>
        + 목적 만들기
      </Button>
    </section>
  )
}
