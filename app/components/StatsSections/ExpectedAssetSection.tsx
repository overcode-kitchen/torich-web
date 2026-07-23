import { formatCurrency } from '@/lib/utils'

interface ExpectedAssetSectionProps {
  /** 지금까지 모은 누적 납입 원금(원) */
  totalPaidPrincipal: number
  /** 현재 매달 납입 중인 금액 합(원) — 0이면 "적립 중" 배지를 숨긴다 */
  totalMonthlyPayment: number
  /** 이번 달 실제로 완료한 적립액(원) — 0보다 크면 "이번 달 +N" 모멘텀을 붙인다 */
  thisMonthAdded: number
  onShowContribution: () => void
}

export default function ExpectedAssetSection({
  totalPaidPrincipal,
  totalMonthlyPayment,
  thisMonthAdded,
  onShowContribution,
}: ExpectedAssetSectionProps) {
  return (
    <section className="bg-card rounded-2xl p-5 mb-4 relative">
      <div className="flex items-center gap-1 mb-2">
        <h2 className="text-sm font-semibold text-foreground-muted">지금까지 모은 돈</h2>
      </div>
      {/* 원금 숫자에 '이번 달 얼마나 넣었나' 모멘텀을 나란히 붙여, 정적 총액이 아니라 지금도
          쌓이는 돈으로 읽히게 한다. 이번 달 완료 적립액이라 실제 데이터 기반.
          '+금액'·초록색은 '수익'으로 오해되므로 쓰지 않고, 카드 문구("넣은 돈")와 같은 '넣었어요'로 맞춘다. */}
      <div className="mb-1 flex items-baseline gap-2 flex-wrap">
        <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
          {formatCurrency(totalPaidPrincipal)}
        </p>
        {thisMonthAdded > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            이번 달 <span className="font-semibold text-foreground">{formatCurrency(thisMonthAdded)}</span> 넣었어요
          </span>
        )}
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
