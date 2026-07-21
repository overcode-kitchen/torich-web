'use client'

import { Check } from '@phosphor-icons/react'
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
  onToggleRetroactive?: (yearMonth: string, currentCompleted: boolean) => void | Promise<void>
  /** 자동 기록 한 줄(그 달 회차 전체) 토글 → 상세에서 완료 되돌리기 */
  onToggleAuto?: (yearMonth: string, currentCompleted: boolean) => void | Promise<void>
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

  // 토글 결과 피드백(하단 '되돌리기' 토스트)은 뷰 레벨에서 onToggleAuto가 담당한다.
  const handleRowClick = (yearMonth: string, currentCompleted: boolean) => {
    if (isRetro) void onToggleRetroactive?.(yearMonth, currentCompleted)
    else void onToggleAuto?.(yearMonth, currentCompleted)
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
            <TableHead className="h-auto px-3 py-3 text-foreground-muted font-semibold text-sm">월</TableHead>
            <TableHead className="h-auto px-3 py-3 text-foreground-muted font-semibold text-sm">투자일</TableHead>
            <TableHead className="h-auto px-3 py-3 text-foreground-muted font-semibold text-sm">납입 금액</TableHead>
            <TableHead className="h-auto px-3 py-3 text-foreground-muted font-semibold text-sm">상태</TableHead>
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
                  'px-3 py-3.5 font-semibold text-[15px]',
                  isRetro ? 'text-foreground-muted' : 'text-foreground'
                )}
              >
                {renderMonthLabel(yearMonth)}
                {isRetro && (
                  <span className="ml-1 text-xs font-normal text-foreground-subtle">(소급)</span>
                )}
              </TableCell>
              <TableCell className="px-3 py-3.5 text-foreground-muted text-sm">
                {renderDateCell(yearMonth)}
              </TableCell>
              <TableCell
                className={cn(
                  'px-3 py-3.5 text-[15px]',
                  isRetro ? 'text-foreground-subtle' : 'text-foreground-muted'
                )}
              >
                {formatCurrency(capturedByMonth?.get(yearMonth) ?? item.monthly_amount)}
              </TableCell>
              <TableCell className="px-3 py-3.5">
                <StatusPill completed={completed} isRetro={isRetro} canToggle={canToggle} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function renderMonthLabel(yearMonth: string) {
  const [y, m] = yearMonth.split('-')
  const month = parseInt(m, 10)
  const thisYear = new Date().getFullYear()
  if (parseInt(y, 10) === thisYear) {
    return `${month}월`
  }
  return `${y.slice(-2)}.${month}월`
}

/**
 * 상태 칸 뱃지. 홈 목적 카드의 토널 pill과 톤을 맞춘다(완료=브랜드 톤, 그 외=중립).
 * 예전의 초록/빨강 텍스트("✓ 완료됨" / "✗ 미완료")는 "미완료"가 연체·실패처럼 읽혀
 * 미납월이 많은 화면이 온통 빨갛게 보이는 문제가 있어 중립 톤으로 바꾼다.
 */
function StatusPill({
  completed,
  isRetro,
  canToggle,
}: {
  completed: boolean
  isRetro: boolean
  canToggle: boolean
}) {
  if (isRetro) {
    if (completed) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-md bg-surface-hover px-2.5 py-1 text-xs font-medium text-foreground-soft"
          title="소급 납입 기록됨"
        >
          <Check className="h-3.5 w-3.5" weight="bold" />
          기록됨
        </span>
      )
    }
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium',
          canToggle
            ? 'bg-surface-hover/60 text-foreground-muted ring-1 ring-inset ring-border-subtle'
            : 'text-foreground-subtle'
        )}
        title={canToggle ? '탭하여 기록' : '추적되지 않음'}
      >
        {canToggle ? '탭하여 기록' : '추적 안 됨'}
      </span>
    )
  }

  return completed ? (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-brand-accent-bg px-2.5 py-1 text-xs font-medium text-brand-accent-text"
      title="해당 월 납입 완료됨"
    >
      <Check className="h-3.5 w-3.5" weight="bold" />
      완료
    </span>
  ) : (
    <span
      className="inline-flex items-center rounded-md bg-surface-hover px-2.5 py-1 text-xs font-medium text-foreground-soft"
      title="해당 월 납입 미완료"
    >
      미완료
    </span>
  )
}
