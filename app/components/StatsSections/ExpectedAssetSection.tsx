import { formatCurrency, formatSignedProfit } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Info } from '@phosphor-icons/react'

interface ExpectedAssetSectionProps {
  selectedYear: number
  setSelectedYear: (year: number) => void
  totalExpectedAsset: number
  hasMaturedInvestments: boolean
  totalMonthlyPayment: number
  /** 선택된 연도 기준 예상 수익(원). 원금 대비 손익. 손실이면 음수. */
  expectedProfit?: number
  /** 선택된 연도 기준 누적 원금(원). 수익률 계산 분모. */
  expectedPrincipal?: number
  onShowCashHold: () => void
  onShowContribution: () => void
}

export default function ExpectedAssetSection({
  selectedYear,
  setSelectedYear,
  totalExpectedAsset,
  hasMaturedInvestments,
  totalMonthlyPayment,
  expectedProfit,
  expectedPrincipal,
  onShowCashHold,
  onShowContribution,
}: ExpectedAssetSectionProps) {
  const showDelta =
    typeof expectedProfit === 'number' &&
    typeof expectedPrincipal === 'number' &&
    expectedPrincipal > 0
  const deltaPercent = showDelta ? (expectedProfit! / expectedPrincipal!) * 100 : 0
  const deltaTone = !showDelta
    ? ''
    : expectedProfit! > 0
      ? 'text-primary'
      : expectedProfit! < 0
        ? 'text-destructive'
        : 'text-muted-foreground'
  return (
    <section className="bg-card rounded-2xl p-5 mb-4 relative">
      <div className="flex items-center gap-3 mb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border border-border hover:border-surface-strong-hover"
            >
              {selectedYear}년 뒤
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[120px]">
            <DropdownMenuItem onClick={() => setSelectedYear(1)}>1년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(3)}>3년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(5)}>5년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(10)}>10년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(30)}>30년 뒤</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <h2 className="text-sm font-semibold text-foreground-muted">예상 자산</h2>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-3">
        <p className="text-2xl font-extrabold tracking-tight text-foreground">
          {formatCurrency(totalExpectedAsset)}
        </p>
        {showDelta && (
          <span className={`text-sm font-semibold ${deltaTone}`}>
            {formatSignedProfit(expectedProfit!)} ({deltaPercent >= 0 ? '+' : ''}
            {deltaPercent.toFixed(1)}%)
          </span>
        )}
      </div>
      {hasMaturedInvestments && (
        <button
          onClick={onShowCashHold}
          className="flex items-center gap-1.5 w-full text-left group mb-3"
        >
          <Info className="w-4 h-4 text-foreground-subtle flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
          <span className="text-xs text-foreground-subtle leading-relaxed group-hover:text-muted-foreground transition-colors">
            만기가 지난 상품은 현금으로 보관한다고 가정했어요.
          </span>
        </button>
      )}
      <button
        onClick={onShowContribution}
        className="inline-flex items-center rounded-full border border-border-subtle bg-muted/30 text-muted-foreground font-medium text-sm px-3 py-1.5 hover:bg-muted/50 hover:text-foreground-muted transition-colors dark:border-border dark:bg-muted-darker dark:text-foreground-soft dark:font-semibold dark:hover:brightness-95 dark:hover:bg-muted-darker dark:hover:text-foreground-soft"
      >
        월 {formatCurrency(totalMonthlyPayment)}씩 투자 중
      </button>
    </section>
  )
}
