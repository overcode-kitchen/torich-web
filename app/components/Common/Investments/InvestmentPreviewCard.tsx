'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { formatCurrency, formatSignedProfit } from '@/lib/utils'
import { calculateFinalAmount } from '@/app/utils/finance'

interface InvestmentPreviewCardProps {
  stockName: string
  monthlyAmount: string  // 콤마 포함 문자열
  period: string
  annualRate: number
  isRateLoading: boolean
  /** 적립형(목표 기간 없음) 여부 */
  isHabitMode?: boolean
}

// 적립형 시뮬레이션 기준 연수 (5/10/20)
const HABIT_SIM_YEARS = [5, 10, 20] as const

const CARD_CLASS =
  'mb-4 bg-[var(--brand-accent-bg)] border-2 border-dashed border-[var(--brand-accent-border)] rounded-2xl p-5 animate-in fade-in-0 slide-in-from-bottom-2'

function CardHeader({
  icon,
  title,
  subtitle,
  isLoading,
}: {
  icon: string
  title: string
  subtitle?: string
  isLoading: boolean
}) {
  return (
    <div className="mb-3 flex items-start gap-1.5">
      {isLoading ? (
        <CircleNotch className="w-4 h-4 animate-spin text-muted-foreground mt-0.5" />
      ) : (
        <span className="text-sm leading-none pt-0.5">{icon}</span>
      )}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">
          {isLoading ? '분석 중...' : title}
        </h3>
        {!isLoading && subtitle && (
          <p className="text-xs text-foreground-subtle mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default function InvestmentPreviewCard({
  stockName,
  monthlyAmount,
  period,
  annualRate,
  isRateLoading,
  isHabitMode = false,
}: InvestmentPreviewCardProps) {
  if (!stockName.trim() || !monthlyAmount) return null

  const monthlyAmountNum = parseInt(monthlyAmount.replace(/,/g, '')) * 10000

  if (isHabitMode) {
    return (
      <div className={CARD_CLASS}>
        <CardHeader
          icon="🔥"
          title="계속 넣으면 얼마가 될까?"
          subtitle={`연 ${annualRate.toFixed(1)}% 수익률 기준`}
          isLoading={isRateLoading}
        />
        <div className="space-y-3">
          {HABIT_SIM_YEARS.map((y) => {
            const value = calculateFinalAmount(monthlyAmountNum, y, annualRate)
            return (
              <div key={y} className="flex justify-between items-baseline gap-3">
                <span className="text-sm text-foreground-muted shrink-0">{y}년 후</span>
                {isRateLoading ? (
                  <CircleNotch className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-base font-semibold text-foreground tabular-nums whitespace-nowrap">
                    약 {formatCurrency(value)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!period) return null

  const periodNum = parseInt(period)
  const finalAmount = calculateFinalAmount(monthlyAmountNum, periodNum, annualRate)
  const totalPrincipal = monthlyAmountNum * periodNum * 12
  const profit = finalAmount - totalPrincipal
  const monthlyManwon = parseInt(monthlyAmount.replace(/,/g, ''))
  const totalMonths = periodNum * 12

  return (
    <div className={CARD_CLASS}>
      <CardHeader
        icon="🔍"
        title="예상 결과"
        subtitle={`연 ${annualRate.toFixed(1)}% 수익률 기준`}
        isLoading={isRateLoading}
      />
      <div className="space-y-3">
        <div className="flex justify-between items-baseline gap-3">
          <span className="text-sm text-foreground-muted shrink-0">만기 금액</span>
          {isRateLoading ? (
            <CircleNotch className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-base font-semibold text-foreground tabular-nums whitespace-nowrap">
              {formatCurrency(finalAmount)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-baseline gap-3">
          <span className="text-sm text-foreground-muted shrink-0">예상 수익</span>
          {isRateLoading ? (
            <CircleNotch className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-base font-semibold text-brand-600 tabular-nums whitespace-nowrap">
              {formatSignedProfit(profit)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-start gap-3">
          <span className="text-sm text-foreground-muted shrink-0">총 투자금</span>
          <div className="text-right min-w-0">
            <p className="text-base font-semibold text-foreground-soft tabular-nums whitespace-nowrap">
              {formatCurrency(totalPrincipal)}
            </p>
            <p className="text-xs text-foreground-subtle mt-0.5 tabular-nums">
              {monthlyManwon}만원 × {totalMonths}개월
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
