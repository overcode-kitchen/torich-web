'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'

export interface UnlinkedRecordsSectionProps {
  records: Investment[]
  isLinking: boolean
  onLink: (recordId: string) => void
  /** 행 탭 시 해당 투자 상세로 이동 */
  onOpenRecord: (recordId: string) => void
}

function modeLabel(periodYears: number | null | undefined): string {
  if (periodYears && periodYears > 0) return `${periodYears}년 목표`
  return '적립형'
}

export function UnlinkedRecordsSection({
  records,
  isLinking,
  onLink,
  onOpenRecord,
}: UnlinkedRecordsSectionProps) {
  if (records.length === 0) return null

  return (
    <section className="py-6 border-t border-border-subtle-lighter">
      <div className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          묶을 수 있는 투자
        </h3>
        <p className="text-xs text-foreground-muted mt-1">
          &lsquo;묶기&rsquo;를 누르면 이 목적의 진척도에 합산돼요.
        </p>
      </div>
      <ul className="flex flex-col">
        {records.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-2 border-b border-border-subtle-lighter pr-2 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => onOpenRecord(r.id)}
              className="min-w-0 flex-1 flex flex-col gap-0.5 rounded-lg px-2 py-3 text-left transition-colors hover:bg-surface active:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={`${r.title} 상세 보기`}
            >
              <span className="text-sm font-semibold text-foreground truncate">
                {r.title}
              </span>
              <span className="text-xs text-foreground-muted">
                월 {formatCurrency(r.monthly_amount)} · {modeLabel(r.period_years)}
              </span>
            </button>
            <Button
              type="button"
              size="xs"
              variant="default"
              className="shrink-0 px-3"
              onClick={() => onLink(r.id)}
              disabled={isLinking}
            >
              묶기
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
