'use client'

import { Card } from '@/components/ui/card'
import { fmt } from '@/app/utils/goal-format'

export interface V2CounterProps {
  /** 화면에 찍히는 값. 카운트업 중에는 목표값까지 올라가는 도중 값이 들어온다. */
  displayAmount: number
  progress: number
}

/**
 * 1억 카운터 — 홈의 1번 요소.
 *
 * 진행 표현은 이 카드 하나뿐이다. 다른 곳에 %·게이지·바를 두지 않는다
 * (06-constraints N-01·N-08). 원금만 센다 — 시세는 카운터에서 뗐다.
 */
export default function V2Counter({ displayAmount, progress }: V2CounterProps) {
  return (
    <Card className="goal-well border-0 p-6">
      <div className="flex flex-col gap-4">
        <span className="goal-well-label text-caption font-medium">1억까지</span>
        <div className="goal-well-num text-display font-bold tabular-nums tracking-tight">
          {fmt(displayAmount)}
          <span className="ml-1 text-heading font-medium">원</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-foreground/15">
          <div
            className="goal-well-fill h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(progress, 1.5)}%` }}
          />
        </div>
        <span className="goal-well-label text-caption font-medium tabular-nums">
          {progress.toFixed(1)}% 왔어요
        </span>
      </div>
    </Card>
  )
}
