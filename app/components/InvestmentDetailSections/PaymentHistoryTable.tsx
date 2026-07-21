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
import { formatSmartDate } from '@/app/utils/date'
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
  /** 자동 기록 한 줄(그 달 회차 전체) 토글 → 상세에서 완료 되돌리기 */
  onToggleAuto?: (yearMonth: string, currentCompleted: boolean) => void
  /** 월(YYYY-MM) → 그 달 매수 시점 실제 납입액(원). 없는 달은 현재 monthly_amount로 폴백 */
  capturedByMonth?: Map<string, number>
}

export function PaymentHistoryTable({
  item,
  rows,
  variant,
  onToggleRetroactive,
  onToggleAuto,
  capturedByMonth,
}: PaymentHistoryTableProps) {
  const isRetro = variant === 'retroactive'
  const canToggle = isRetro ? !!onToggleRetroactive : !!onToggleAuto
  const handleRowClick = (yearMonth: string, currentCompleted: boolean) => {
    if (isRetro) onToggleRetroactive?.(yearMonth, currentCompleted)
    else onToggleAuto?.(yearMonth, currentCompleted)
  }

  const renderDateCell = (yearMonth: string) => {
    if (isRetro) return <span className="text-foreground-subtle">-</span>
    if (!item.investment_days || item.investment_days.length === 0) return '-'
    const [y, m] = yearMonth.split('-')
    const year = parseInt(y, 10)
    const month = parseInt(m, 10)
    return [...item.investment_days]
      .sort((a, b) => a - b)
      .map((d) => formatSmartDate(new Date(year, month - 1, d)))
      .join(', ')
  }

  const renderMonthLabel = (yearMonth: string) => {
    const [y, m] = yearMonth.split('-')
    const month = parseInt(m, 10)
    const thisYear = new Date().getFullYear()
    if (parseInt(y, 10) === thisYear) {
      return `${month}월`
    }
    return `${y.slice(-2)}.${month}월`
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
                  ? () => handleRowClick(yearMonth, completed)
                  : undefined
              }
            >
              <TableCell
                className={cn(
                  'font-medium text-sm',
                  isRetro ? 'text-foreground-muted' : 'text-foreground'
                )}
              >
                {renderMonthLabel(yearMonth)}
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
                {formatCurrency(capturedByMonth?.get(yearMonth) ?? item.monthly_amount)}
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
    <span className="text-success font-medium" title="해당 월 납입 완료됨">
      ✓ 완료됨
    </span>
  ) : (
    <span className="text-destructive font-medium" title="해당 월 납입 미완료">
      ✗ 미완료
    </span>
  )
}
