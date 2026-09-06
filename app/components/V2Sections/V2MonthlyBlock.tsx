'use client'

import { Card } from '@/components/ui/card'
import { Check } from '@phosphor-icons/react'
import { shortWon } from '@/app/utils/goal-format'
import type { V2Item } from '@/app/hooks/v2/useV2Sandbox'
import { cn } from '@/lib/utils'

export interface V2MonthlyBlockProps {
  plan: number
  filled: number
  remaining: number
  payday: number
  items: V2Item[]
  onToggle: (id: string) => void
}

/**
 * 이번 달 현황 — 홈의 2번 블록.
 *
 * 브리프 §3은 '이번 달 현황'과 '적립 항목 목록'을 따로 뒀지만, 그려보니 같은 목록이었다.
 * 나눠 그리면 같은 항목이 두 번 나와 N-08(같은 값의 두 번째 표현)에 걸린다 → 하나로 합쳤다.
 * 남는 블록 한 칸은 채우지 않고 비워둔다(06-constraints §2 운용규칙 1).
 *
 * 항목은 **이미 채워져 있고**, 사용자가 하는 일은 틀렸을 때 내리는 것뿐이다.
 */
export default function V2MonthlyBlock({
  plan,
  filled,
  remaining,
  payday,
  items,
  onToggle,
}: V2MonthlyBlockProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-bold">이번 달</h2>
        <p className="text-caption tabular-nums text-muted-foreground">
          {remaining > 0 ? (
            <>
              매달 {shortWon(plan)} 중 {shortWon(filled)} 채움 ·{' '}
              <span className="font-bold text-foreground">{shortWon(remaining)} 남음</span>
            </>
          ) : (
            <>
              매달 {shortWon(plan)}, <span className="font-bold text-foreground">다 채웠어요</span>
            </>
          )}
        </p>
      </div>

      <div className="mt-2 flex flex-col">
        {items.length === 0 ? (
          <p className="py-3 text-label text-muted-foreground">아직 담은 항목이 없어요</p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 py-3',
                index > 0 && 'border-t border-border-subtle',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border',
                  item.filled
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-progress-track text-transparent',
                )}
                aria-hidden
              >
                <Check className="size-3" weight="bold" />
              </span>

              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    'truncate text-label',
                    item.filled ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.name}
                </span>
                {/* 못 넣은 달을 벌주지 않는다 — 빨강도 D-day도 쓰지 않는다(N-13). */}
                <span className="text-micro text-muted-foreground">
                  {item.filled ? `${payday}일 · 들어갔어요` : '이번 달은 빼뒀어요'}
                </span>
              </div>

              <span
                className={cn(
                  'shrink-0 text-label tabular-nums',
                  item.filled ? 'font-bold text-foreground' : 'text-muted-foreground',
                )}
              >
                {shortWon(item.amount)}
              </span>

              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="-mr-2 shrink-0 px-2 py-1 text-caption text-muted-foreground"
              >
                {item.filled ? '내리기' : '되돌리기'}
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
