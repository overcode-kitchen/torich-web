'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'

export interface LinkedRecordsSectionProps {
  records: Investment[]
  isLinking: boolean
  onUnlink: (recordId: string) => void
}

function modeLabel(periodYears: number | null | undefined): string {
  if (periodYears && periodYears > 0) return `${periodYears}년 목표`
  return '적립형'
}

export function LinkedRecordsSection({
  records,
  isLinking,
  onUnlink,
}: LinkedRecordsSectionProps) {
  return (
    <section className="py-6 border-t border-border-subtle-lighter">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        묶인 투자 {records.length > 0 && `(${records.length})`}
      </h3>
      {records.length === 0 ? (
        <p className="text-sm text-foreground-subtle">
          아직 묶인 투자가 없어요. 아래에서 묶을 투자를 골라보세요.
        </p>
      ) : (
        <ul className="flex flex-col">
          {records.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 border-b border-border-subtle px-2 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground truncate">
                  {r.title}
                </span>
                <span className="text-xs text-foreground-subtle">
                  월 {formatCurrency(r.monthly_amount)} · {modeLabel(r.period_years)}
                </span>
              </div>
              <Button
                size="xs"
                variant="ghost"
                className="shrink-0 text-muted-foreground hover:text-foreground-soft hover:bg-secondary h-auto py-1 px-2"
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
