import { formatCurrency } from '@/lib/utils'

interface ExpectedAssetSectionProps {
  /** 지금까지 모은 누적 납입 원금(원) */
  totalPaidPrincipal: number
  /** 현재 매달 납입 중인 금액 합(원) — 0이면 "적립 중" 배지를 숨긴다 */
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
      <div className="flex items-center gap-1 mb-2">
        <h2 className="text-sm font-semibold text-foreground-muted">지금까지 모은 돈</h2>
      </div>
      <div className="mb-1">
        <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
          {formatCurrency(totalPaidPrincipal)}
        </p>
      </div>
      {/* 집계 기준 안내(#28) — 이 숫자가 '불어난 값'이 아니라 '내가 넣은 돈'임을 대조로 짚어준다.
          납입 원금·평가액 같은 용어 대신 벌었는지/넣었는지 대비로 바로 이해되게 한다. */}
      <p className="text-xs leading-relaxed text-muted-foreground mb-3">
        얼마를 벌었는지가 아니라, 지금까지 넣은 돈이에요.
      </p>
      {totalMonthlyPayment > 0 && (
        <button
          onClick={onShowContribution}
          className="inline-flex items-center rounded-full border border-border-subtle bg-muted/30 text-muted-foreground font-medium text-sm px-3 py-1.5 hover:bg-muted/50 hover:text-foreground-muted transition-colors dark:border-border dark:bg-muted-darker dark:text-foreground-soft dark:font-semibold dark:hover:brightness-95 dark:hover:bg-muted-darker dark:hover:text-foreground-soft"
        >
          월 {formatCurrency(totalMonthlyPayment)}씩 적립 중
        </button>
      )}
    </section>
  )
}
