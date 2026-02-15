import { formatCurrency } from '@/lib/utils'
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
  onShowCashHold: () => void
  onShowContribution: () => void
}

export default function ExpectedAssetSection({
  selectedYear,
  setSelectedYear,
  totalExpectedAsset,
  hasMaturedInvestments,
  totalMonthlyPayment,
  onShowCashHold,
  onShowContribution,
}: ExpectedAssetSectionProps) {
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
      <p className="text-2xl font-extrabold tracking-tight text-foreground mb-3">
        {formatCurrency(totalExpectedAsset)}
      </p>
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
