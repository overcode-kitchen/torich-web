'use client'

import { useMemo, useState } from 'react'
import { useInvestmentDetailContext } from './InvestmentDetailContext'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import { buildCapturedByMonth } from '@/app/utils/realized-principal'
import type { PaymentHistorySectionProps as OriginalPaymentHistorySectionProps } from './types'
import { PaymentHistoryTable } from './PaymentHistoryTable'
import BulkCompleteRetroactiveModal from './BulkCompleteRetroactiveModal'

interface PaymentHistorySectionProps extends Partial<OriginalPaymentHistorySectionProps> {
  historyRef: React.RefObject<HTMLElement | null>
}

export function PaymentHistorySection(props: PaymentHistorySectionProps) {
  // 컨텍스트(상세 화면) 안에서도, props로 직접 주입되는 경로에서도 렌더된다.
  // useInvestmentDetailContext는 useContext를 항상 호출한 뒤 미제공 시 throw만 하므로
  // 훅 호출 순서는 매 렌더 동일하다(rules-of-hooks는 과잉 탐지라 이 줄만 예외 처리).
  let contextValue: ReturnType<typeof useInvestmentDetailContext> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    contextValue = useInvestmentDetailContext()
  } catch {
    // 컨텍스트 미제공 → props에 의존
  }

  // 각 납입의 매수 시점 실제 금액(원) — 표에서 행별 금액을 현재 금액이 아닌 그때 금액으로 표시
  const { capturedAmounts } = usePaymentHistory()

  const item = props.item || contextValue?.item
  const investmentData = props.paymentHistory !== undefined ? props : contextValue?.investmentData

  const {
    paymentHistory = props.paymentHistory,
    retroactivePaymentHistory = props.retroactivePaymentHistory,
    hasMorePaymentHistory = props.hasMorePaymentHistory,
    loadMore = props.loadMore,
    onToggleRetroactive,
    onMarkAllRetroactive,
    onToggleAuto,
  } = investmentData || {}

  const { historyRef } = props

  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [isBulkPending, setIsBulkPending] = useState(false)

  const capturedByMonth = useMemo(
    () => buildCapturedByMonth(capturedAmounts.get(item?.id ?? '')),
    [capturedAmounts, item?.id],
  )

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
    <section ref={historyRef} className="py-8 space-y-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        월별 납입 기록
      </h3>

      {hasRetroactive && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <p className="text-sm font-medium text-foreground-muted">
              소급 기록
            </p>
            <p className="text-xs text-foreground-muted">
              앱 등록 이전 기간
            </p>
          </div>
          <PaymentHistoryTable
            item={item}
            rows={retroactivePaymentHistory!}
            variant="retroactive"
            onToggleRetroactive={onToggleRetroactive}
            capturedByMonth={capturedByMonth}
          />
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <p className="text-xs text-foreground-muted">
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
              <p className="text-xs text-foreground-muted">
                앱 등록 이후
              </p>
            </div>
          )}
          <PaymentHistoryTable
            item={item}
            rows={paymentHistory}
            variant="auto"
            onToggleAuto={onToggleAuto}
            capturedByMonth={capturedByMonth}
          />
          {onToggleAuto && (
            <p className="px-1 pt-1.5 text-sm text-foreground-muted">
              각 달을 탭하면 그 달 납입을 완료하거나 되돌릴 수 있어요.
            </p>
          )}
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
