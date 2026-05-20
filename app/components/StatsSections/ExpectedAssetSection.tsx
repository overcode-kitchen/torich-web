import { formatCurrency } from '@/lib/utils'

interface ExpectedAssetSectionProps {
  /** 지금까지 모은 누적 납입 원금(원) */
  totalPaidPrincipal: number
  totalMonthlyPayment: number
  onShowContribution: () => void
}

export default function ExpectedAssetSection({
  totalPaidPrincipal,
  totalMonthlyPayment,
  onShowContribution,
}: ExpectedAssetSectionProps) {
  return (
    <section className="bg-card rounded-2xl p-5 mb-4 relative">
      <div className="flex items-center gap-1 mb-3">
        <h2 className="text-sm font-semibold text-foreground-muted">지금까지 모은 원금</h2>
      </div>
      <div className="mb-3">
        <p className="text-2xl font-extrabold tracking-tight text-foreground">
          {formatCurrency(totalPaidPrincipal)}
        </p>
      </div>
      <button
        onClick={onShowContribution}
        className="inline-flex items-center rounded-full border border-border-subtle bg-muted/30 text-muted-foreground font-medium text-sm px-3 py-1.5 hover:bg-muted/50 hover:text-foreground-muted transition-colors dark:border-border dark:bg-muted-darker dark:text-foreground-soft dark:font-semibold dark:hover:brightness-95 dark:hover:bg-muted-darker dark:hover:text-foreground-soft"
      >
        월 {formatCurrency(totalMonthlyPayment)}씩 적립 중
      </button>
    </section>
  )
}
