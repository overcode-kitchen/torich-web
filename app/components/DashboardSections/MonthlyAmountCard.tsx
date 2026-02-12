'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export interface MonthlyAmountCardProps {
  records: any[]
  totalMonthlyPayment: number
  showMonthlyAmount: boolean
  onToggleMonthlyAmount: () => void
}

export default function MonthlyAmountCard({
  records,
  totalMonthlyPayment,
  showMonthlyAmount,
  onToggleMonthlyAmount,
}: MonthlyAmountCardProps) {
  if (records.length === 0 || totalMonthlyPayment === 0) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-card px-4 py-3">
      <p className="text-sm font-medium text-muted-foreground">이번 달 투자금액</p>
      <div className="flex items-center gap-2">
        {showMonthlyAmount ? (
          <span className="text-base font-semibold text-foreground">
            {formatCurrency(totalMonthlyPayment)}
          </span>
        ) : (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Image
                key={i}
                src="/icons/3d/coin-front.png"
                alt=""
                width={28}
                height={28}
                className="w-7 h-7"
              />
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onToggleMonthlyAmount}
          className="text-muted-foreground hover:text-foreground-soft hover:bg-secondary h-auto py-1 px-2"
        >
          {showMonthlyAmount ? '가리기' : '보기'}
        </Button>
      </div>
    </div>
  )
}
