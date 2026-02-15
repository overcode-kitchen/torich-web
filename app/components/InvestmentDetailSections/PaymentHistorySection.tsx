'use client'

import { formatCurrency } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useInvestmentDetailContext } from './InvestmentDetailContext'
import type { PaymentHistorySectionProps as OriginalPaymentHistorySectionProps } from './types'

interface PaymentHistorySectionProps extends Partial<OriginalPaymentHistorySectionProps> {
  historyRef: React.RefObject<HTMLElement | null>
}

export function PaymentHistorySection(props: PaymentHistorySectionProps) {
  let contextValue: any = null
  try {
    contextValue = useInvestmentDetailContext()
  } catch (e) {
    // Context missing, will rely on props
  }

  const item = props.item || contextValue?.item
  const investmentData = props.paymentHistory !== undefined ? props : contextValue?.investmentData

  const {
    paymentHistory = props.paymentHistory,
    hasMorePaymentHistory = props.hasMorePaymentHistory,
    loadMore = props.loadMore,
  } = investmentData || {}

  const { historyRef } = props

  if (!item || !paymentHistory) return null

  return (
    <section ref={historyRef} className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-3">
        월별 납입 기록
      </h3>
      <div className="overflow-x-auto rounded-lg">
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
            {paymentHistory.map(({ yearMonth, completed: monthCompleted }: { yearMonth: string, completed: boolean }) => (
              <TableRow key={yearMonth} className="border-border-subtle">
                <TableCell className="font-medium text-foreground text-sm">
                  {yearMonth.replace('-', '.')}
                </TableCell>
                <TableCell className="text-foreground-muted text-sm">
                  {item.investment_days && item.investment_days.length > 0
                    ? [...item.investment_days].sort((a, b) => a - b).map((d) => {
                      const [y, m] = yearMonth.split('-')
                      return `${y}.${m}.${String(d).padStart(2, '0')}`
                    }).join(', ')
                    : '-'}
                </TableCell>
                <TableCell className="text-foreground-muted text-sm">
                  {formatCurrency(item.monthly_amount)}
                </TableCell>
                <TableCell className="text-sm">
                  {monthCompleted ? (
                    <span className="text-green-600 font-medium" title="해당 월 납입 완료됨">
                      ✓ 완료됨
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium" title="해당 월 납입 미완료">
                      ✗ 미완료
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {hasMorePaymentHistory && (
        <button
          type="button"
          onClick={loadMore}
          className="mt-3 w-full py-2.5 text-sm font-medium text-foreground-muted bg-surface-hover hover:bg-secondary rounded-lg transition-colors"
        >
          이어서 보기
        </button>
      )}
    </section>
  )
}
