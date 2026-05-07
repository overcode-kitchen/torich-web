'use client'

import { Button } from '@/components/ui/button'
import type { Investment } from '@/app/types/investment'

export interface UnlinkedRecordsSectionProps {
  records: Investment[]
  isLinking: boolean
  onLink: (recordId: string) => void
}

function formatAmount(value: number): string {
  return value.toLocaleString('ko-KR')
}

function modeLabel(periodYears: number | null | undefined): string {
  if (periodYears && periodYears > 0) return `${periodYears}년 목표`
  return '적립형'
}

export function UnlinkedRecordsSection({
  records,
  isLinking,
  onLink,
}: UnlinkedRecordsSectionProps) {
  if (records.length === 0) return null

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border-subtle-lighter bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          이 목적에 묶을 수 있는 투자
        </h2>
        <p className="text-xs text-foreground-subtle">
          '묶기'를 누르면 이 목적의 진척도에 합산돼요.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {records.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-4 py-3"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground">{r.title}</span>
              <span className="text-xs text-foreground-subtle">
                월 {formatAmount(r.monthly_amount)}원 ·{' '}
                {modeLabel(r.period_years)}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLink(r.id)}
              disabled={isLinking}
            >
              묶기
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
