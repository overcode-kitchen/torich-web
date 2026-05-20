'use client'

import { formatCurrency } from '@/lib/utils'

interface InvestmentPreviewCardProps {
  stockName: string
  monthlyAmount: string  // 콤마 포함 문자열
  period: string
  /** 적립형(목표 기간 없음) 여부 */
  isHabitMode?: boolean
}

const CARD_CLASS =
  'mb-4 bg-[var(--brand-accent-bg)] border-2 border-dashed border-[var(--brand-accent-border)] rounded-2xl p-5 animate-in fade-in-0 slide-in-from-bottom-2'

export default function InvestmentPreviewCard({
  stockName,
  monthlyAmount,
  period,
  isHabitMode = false,
}: InvestmentPreviewCardProps) {
  if (!stockName.trim() || !monthlyAmount) return null

  const monthlyAmountNum = parseInt(monthlyAmount.replace(/,/g, '')) * 10000

  return (
    <div className={CARD_CLASS}>
      <div className="mb-3 flex items-start gap-1.5">
        <span className="text-sm leading-none pt-0.5">📌</span>
        <h3 className="text-sm font-semibold text-foreground">적립 요약</h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-baseline gap-3">
          <span className="text-sm text-foreground-muted shrink-0">매달 납입액</span>
          <span className="text-base font-semibold text-foreground tabular-nums whitespace-nowrap">
            {formatCurrency(monthlyAmountNum)}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-3">
          <span className="text-sm text-foreground-muted shrink-0">목표 기간</span>
          <span className="text-base font-semibold text-foreground tabular-nums whitespace-nowrap">
            {isHabitMode || !period ? '없음 (계속 적립)' : `${period}년`}
          </span>
        </div>
      </div>
    </div>
  )
}
