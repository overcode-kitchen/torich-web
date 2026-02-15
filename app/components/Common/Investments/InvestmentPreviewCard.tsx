'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/utils'
import { calculateFinalAmount } from '@/app/utils/finance'

interface InvestmentPreviewCardProps {
  stockName: string
  monthlyAmount: string  // 콤마 포함 문자열
  period: string
  annualRate: number
  isRateLoading: boolean
}

export default function InvestmentPreviewCard({
  stockName,
  monthlyAmount,
  period,
  annualRate,
  isRateLoading,
}: InvestmentPreviewCardProps) {
  if (!stockName.trim() || !monthlyAmount || !period) {
    return null
  }

  const monthlyAmountNum = parseInt(monthlyAmount.replace(/,/g, '')) * 10000
  const periodNum = parseInt(period)
  const finalAmount = calculateFinalAmount(monthlyAmountNum, periodNum, annualRate)
  const totalPrincipal = monthlyAmountNum * periodNum * 12
  const profit = finalAmount - totalPrincipal

  return (
    <div className="mb-4 bg-[var(--brand-accent-bg)] border-2 border-dashed border-[var(--brand-accent-border)] rounded-2xl p-5 animate-in fade-in-0 slide-in-from-bottom-2">
      <div className="flex items-center gap-2 mb-4">
        {isRateLoading ? (
          <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-lg">🔍</span>
        )}
        <h3 className="text-sm font-bold text-foreground">
          {isRateLoading ? '분석 중...' : '예상 결과'}
        </h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground-muted">만기 금액</span>
          {isRateLoading ? (
            <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(finalAmount)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground-muted">예상 수익</span>
          {isRateLoading ? (
            <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-lg font-bold text-brand-600">
              + {formatCurrency(profit)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground-muted">
            총 투자금 ({parseInt(monthlyAmount.replace(/,/g, ''))}만원 × {parseInt(period) * 12}개월)
          </span>
          <span className="text-base font-semibold text-foreground-soft">
            {formatCurrency(totalPrincipal)}
          </span>
        </div>
      </div>
    </div>
  )
}
