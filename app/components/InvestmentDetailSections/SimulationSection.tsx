'use client'

import { formatCurrency } from '@/lib/utils'
import { calculateFinalAmount } from '@/app/utils/finance'
import { useInvestmentDetailContext } from './InvestmentDetailContext'

const SIM_YEARS = [5, 10, 20] as const

interface SimulationSectionProps {
  /** 수정 모드에서는 숨김 */
  isEditMode?: boolean
  /** Goal Mode 전환(편집 진입) 핸들러 */
  onConvertToGoal?: () => void
}

/**
 * 적립형(Habit Mode) 전용 시뮬레이션 섹션.
 * "계속 넣으면 얼마가 될까?" 5/10/20년 후 예상 자산을 보여준다.
 */
export function SimulationSection({ isEditMode, onConvertToGoal }: SimulationSectionProps) {
  let contextValue: any = null
  try {
    contextValue = useInvestmentDetailContext()
  } catch (e) {
    // Context 미주입 시 렌더하지 않는다
  }

  if (!contextValue) return null
  const { item, investmentData } = contextValue
  if (isEditMode) return null
  if (!investmentData?.isHabitMode) return null

  const monthly = item.monthly_amount as number
  const rate = investmentData.displayAnnualRate as number

  return (
    <section className="py-6 border-b border-border-subtle-lighter">
      <div className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          계속 넣으면 얼마가 될까?
        </h3>
        <p className="text-sm text-foreground-subtle mt-1">
          연 {rate.toFixed(1)}% 수익률 기준
        </p>
      </div>
      <div className="rounded-2xl bg-card divide-y divide-border-subtle-lighter">
        {SIM_YEARS.map((y) => {
          const value = calculateFinalAmount(monthly, y, rate)
          return (
            <div key={y} className="flex items-baseline justify-between px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">{y}년 후</span>
              <span className="text-base font-semibold text-foreground">
                약 {formatCurrency(Math.round(value))}
              </span>
            </div>
          )
        })}
      </div>
      {onConvertToGoal && (
        <button
          type="button"
          onClick={onConvertToGoal}
          className="mt-4 w-full text-sm font-medium text-primary hover:underline text-left"
        >
          목표 기간을 설정하면 더 정확히 볼 수 있어요 →
        </button>
      )}
    </section>
  )
}
