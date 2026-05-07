'use client'

import { Button } from '@/components/ui/button'
import type { Investment } from '@/app/types/investment'

export interface LinkedRecordsSectionProps {
  records: Investment[]
  isLinking: boolean
  onUnlink: (recordId: string) => void
}

function formatAmount(value: number): string {
  return value.toLocaleString('ko-KR')
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
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-base text-muted-foreground">
        아직 묶인 투자가 없어요. 아래에서 묶을 투자를 골라보세요.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-2xl font-semibold tracking-tight">
        묶인 투자 ({records.length})
      </h2>
      <ul className="flex flex-col gap-3">
        {records.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3"
          >
            <div className="flex flex-col gap-1">
              <span className="text-base text-foreground">{r.title}</span>
              <span className="text-sm text-muted-foreground">
                월 {formatAmount(r.monthly_amount)}원 ·{' '}
                {modeLabel(r.period_years)}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUnlink(r.id)}
              disabled={isLinking}
            >
              풀기
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
