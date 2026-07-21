'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'

export interface LinkedRecordsSectionProps {
  records: Investment[]
  isLinking: boolean
  onUnlink: (recordId: string) => void
  /** 행 탭 시 해당 투자 상세로 이동 */
  onOpenRecord: (recordId: string) => void
}

function modeLabel(periodYears: number | null | undefined): string {
  if (periodYears && periodYears > 0) return `${periodYears}년 목표`
  return '적립형'
}

export function LinkedRecordsSection({
  records,
  isLinking,
  onUnlink,
  onOpenRecord,
}: LinkedRecordsSectionProps) {
  return (
    <section className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        묶인 투자 {records.length > 0 && `(${records.length})`}
      </h3>
      {records.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          아직 묶인 투자가 없어요. 아래에서 묶을 투자를 골라보세요.
        </p>
      ) : (
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
                variant="tonal"
                className="shrink-0 px-3"
                onClick={() => onUnlink(r.id)}
                disabled={isLinking}
              >
                풀기
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
