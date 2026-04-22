'use client'

import { formatCurrency, cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Investment } from '@/app/types/investment'

export interface PaymentHistoryRow {
  yearMonth: string
  monthLabel: string
  completed: boolean
  isRetroactive: boolean
}

interface PaymentHistoryTableProps {
  item: Investment
  rows: PaymentHistoryRow[]
  variant: 'auto' | 'retroactive'
  onToggleRetroactive?: (yearMonth: string, currentCompleted: boolean) => void
}

export function PaymentHistoryTable({
  item,
  rows,
  variant,
  onToggleRetroactive,
}: PaymentHistoryTableProps) {
  const isRetro = variant === 'retroactive'
  const canToggle = isRetro && !!onToggleRetroactive

  const renderDateCell = (yearMonth: string) => {
    if (isRetro) return <span className="text-foreground-subtle">-</span>
    if (!item.investment_days || item.investment_days.length === 0) return '-'
    const [y, m] = yearMonth.split('-')
    return [...item.investment_days]
      .sort((a, b) => a - b)
      .map((d) => `${y}.${m}.${String(d).padStart(2, '0')}`)
      .join(', ')
  }

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-lg',
        isRetro && 'bg-surface/60 ring-1 ring-border-subtle-lighter'
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-foreground-muted font-semibold text-sm">월</TableHead>
            <TableHead className="text-foreground-muted font-semibold text-sm">투자일</TableHead>
            <TableHead className="text-foreground-muted font-semibold text-sm">납입 금액</TableHead>
            <TableHead className="text-foreground-muted font-semibold text-sm">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ yearMonth, completed }) => (
            <TableRow
              key={yearMonth}
              className={cn(
                'border-border-subtle',
                canToggle && 'cursor-pointer hover:bg-surface-hover/60 transition-colors'
              )}
              onClick={
                canToggle
                  ? () => onToggleRetroactive!(yearMonth, completed)
                  : undefined
              }
            >
              <TableCell
                className={cn(
                  'font-medium text-sm',
                  isRetro ? 'text-foreground-muted' : 'text-foreground'
                )}
              >
                {yearMonth.replace('-', '.')}
                {isRetro && (
                  <span className="ml-1 text-[11px] text-foreground-subtle">(소급)</span>
                )}
              </TableCell>
              <TableCell className="text-foreground-muted text-sm">
                {renderDateCell(yearMonth)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-sm',
                  isRetro ? 'text-foreground-subtle' : 'text-foreground-muted'
                )}
              >
                {formatCurrency(item.monthly_amount)}
              </TableCell>
              <TableCell className="text-sm">
                {renderStatus(completed, isRetro, canToggle)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function renderStatus(completed: boolean, isRetro: boolean, canToggle: boolean) {
  if (isRetro) {
    if (completed) {
      return (
        <span className="text-foreground-muted font-medium" title="소급 납입 기록됨">
          ✓ 기록됨
        </span>
      )
    }
    return (
      <span className="text-foreground-subtle" title={canToggle ? '탭하여 기록' : '추적되지 않음'}>
        {canToggle ? '○ 탭하여 기록' : '추적되지 않음'}
      </span>
    )
  }

  return completed ? (
    <span className="text-green-600 font-medium" title="해당 월 납입 완료됨">
      ✓ 완료됨
    </span>
  ) : (
    <span className="text-red-500 font-medium" title="해당 월 납입 미완료">
      ✗ 미완료
    </span>
  )
}
