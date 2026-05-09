import type { MonthlyPaymentDelta } from '@/app/utils/stats'

interface MonthlyStatusSectionProps {
  thisMonth: {
    totalPayment: number
    completedPayment: number
    progress: number
    remainingPayment: number
  }
  delta?: Pick<MonthlyPaymentDelta, 'deltaAmount' | 'hasComparison'>
}

export default function MonthlyStatusSection({ thisMonth, delta }: MonthlyStatusSectionProps) {
  const showDelta = delta?.hasComparison
  const deltaTone = !delta
    ? ''
    : delta.deltaAmount > 0
      ? 'text-primary'
      : delta.deltaAmount < 0
        ? 'text-muted-foreground'
        : 'text-foreground-muted'
  const deltaText = !delta
    ? ''
    : delta.deltaAmount > 0
      ? `+${delta.deltaAmount.toLocaleString()}원`
      : delta.deltaAmount < 0
        ? `${delta.deltaAmount.toLocaleString()}원`
        : '지난달과 동일'

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-3">이번 달 납입 현황</h2>
      <p className="text-lg font-bold text-foreground mb-2">
        {thisMonth.completedPayment.toLocaleString()}원 / {thisMonth.totalPayment.toLocaleString()}원
      </p>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground-soft rounded-full transition-all duration-500"
          style={{ width: `${thisMonth.progress}%` }}
        />
      </div>
      <p className="text-xs text-foreground-muted mt-2 text-right">
        남은 금액: {thisMonth.remainingPayment.toLocaleString()}원
      </p>
      {showDelta && (
        <p className="text-xs text-right mt-1">
          지난달 대비 <span className={deltaTone}>{deltaText}</span>
        </p>
      )}
    </section>
  )
}
