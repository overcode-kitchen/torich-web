'use client'

import { useState } from 'react'
import { useInvestmentDetailContext } from './InvestmentDetailContext'
import type { PaymentHistorySectionProps as OriginalPaymentHistorySectionProps } from './types'
import { PaymentHistoryTable } from './PaymentHistoryTable'
import BulkCompleteRetroactiveModal from './BulkCompleteRetroactiveModal'

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
    retroactivePaymentHistory = props.retroactivePaymentHistory,
    hasMorePaymentHistory = props.hasMorePaymentHistory,
    loadMore = props.loadMore,
    onToggleRetroactive,
    onMarkAllRetroactive,
  } = investmentData || {}

  const { historyRef } = props

  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [isBulkPending, setIsBulkPending] = useState(false)

  if (!item || !paymentHistory) return null

  const hasRetroactive = !!(retroactivePaymentHistory && retroactivePaymentHistory.length > 0)
  const hasAuto = paymentHistory.length > 0

  if (!hasRetroactive && !hasAuto) return null

  const unrecordedRetroMonths = hasRetroactive
    ? retroactivePaymentHistory!.filter((r: { completed: boolean }) => !r.completed).map((r: { yearMonth: string }) => r.yearMonth)
    : []
  const canBulkComplete = !!onMarkAllRetroactive && unrecordedRetroMonths.length > 0

  const handleBulkConfirm = async () => {
    if (!onMarkAllRetroactive || unrecordedRetroMonths.length === 0) return
    setIsBulkPending(true)
    try {
      await onMarkAllRetroactive(unrecordedRetroMonths)
      setShowBulkConfirm(false)
    } finally {
      setIsBulkPending(false)
    }
  }

  return (
    <section ref={historyRef} className="py-6 space-y-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        월별 납입 기록
      </h3>

      {hasRetroactive && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <p className="text-sm font-medium text-foreground-muted">
              소급 기록
            </p>
            <p className="text-xs text-foreground-subtle">
              앱 등록 이전 기간
            </p>
          </div>
          <PaymentHistoryTable
            item={item}
            rows={retroactivePaymentHistory!}
            variant="retroactive"
            onToggleRetroactive={onToggleRetroactive}
          />
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <p className="text-xs text-foreground-subtle">
              {onToggleRetroactive
                ? '탭해서 당시 납입 여부를 기록할 수 있어요.'
                : '앱 시작 전 기간은 자동 추적되지 않아요.'}
            </p>
            {canBulkComplete && (
              <button
                type="button"
                onClick={() => setShowBulkConfirm(true)}
                className="shrink-0 text-xs font-medium text-foreground-soft bg-surface-hover hover:bg-secondary rounded-md px-2.5 py-1.5 transition-colors"
              >
                전체 완료 표시
              </button>
            )}
          </div>
        </div>
      )}

      {hasAuto && (
        <div className="space-y-2">
          {hasRetroactive && (
            <div className="flex items-baseline justify-between px-1">
              <p className="text-sm font-medium text-foreground">
                자동 추적
              </p>
              <p className="text-xs text-foreground-subtle">
                앱 등록 이후
              </p>
            </div>
          )}
          <PaymentHistoryTable
            item={item}
            rows={paymentHistory}
            variant="auto"
          />
          {hasMorePaymentHistory && (
            <button
              type="button"
              onClick={loadMore}
              className="mt-3 w-full py-2.5 text-sm font-medium text-foreground-muted bg-surface-hover hover:bg-secondary rounded-lg transition-colors"
            >
              이어서 보기
            </button>
          )}
        </div>
      )}

      <BulkCompleteRetroactiveModal
        isOpen={showBulkConfirm}
        count={unrecordedRetroMonths.length}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleBulkConfirm}
        isPending={isBulkPending}
      />
    </section>
  )
}
