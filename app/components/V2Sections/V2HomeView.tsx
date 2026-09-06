'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import V2TabScaffold from './V2TabScaffold'
import V2Counter from './V2Counter'
import V2MonthlyBlock from './V2MonthlyBlock'
import type { V2Item } from '@/app/hooks/v2/useV2Sandbox'

export interface V2HomeViewProps {
  displayAmount: number
  progress: number
  plan: number
  filled: number
  remaining: number
  payday: number
  items: V2Item[]
  allFilled: boolean
  onToggle: (id: string) => void
}

/**
 * 홈 — 요소 예산: 블록 4 · 숫자 3 · 차트 0 · primary 1 (06-constraints §2).
 * 지금 쓰는 것은 블록 3(카운터 · 이번 달 · 축하)이고, 남는 한 칸은 비워둔다.
 */
export default function V2HomeView({
  displayAmount,
  progress,
  plan,
  filled,
  remaining,
  payday,
  items,
  allFilled,
  onToggle,
}: V2HomeViewProps) {
  return (
    <V2TabScaffold current="home">
      <V2Counter displayAmount={displayAmount} progress={progress} />

      <V2MonthlyBlock
        plan={plan}
        filled={filled}
        remaining={remaining}
        payday={payday}
        items={items}
        onToggle={onToggle}
      />

      {/* 축하는 사건이 있을 때만 온다 — 상시 응원 문구는 두지 않는다(N-12). */}
      {allFilled && remaining === 0 && (
        <Card className="flex items-center gap-3 border-brand-accent-border p-4">
          <span className="text-heading" aria-hidden>
            🌰
          </span>
          <div className="flex flex-col">
            <span className="text-label font-bold">이번 달, 다 채우셨어요</span>
            <span className="text-caption text-muted-foreground">
              계획한 만큼 전부 들어갔습니다.
            </span>
          </div>
        </Card>
      )}

      <div className="mt-2">
        <Button asChild className="h-12 w-full text-body font-bold">
          <Link href="/v2/add">적립 항목 담기</Link>
        </Button>
      </div>
    </V2TabScaffold>
  )
}
