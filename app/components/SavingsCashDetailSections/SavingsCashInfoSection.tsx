'use client'

import { formatCurrency } from '@/lib/utils'
import { formatFullDate } from '@/app/utils/date'
import { formatInvestmentDays } from '@/app/types/investment'
import type { Investment } from '@/app/types/investment'
import type { SavingsMaturityResult } from '@/app/utils/savingsMaturity'

interface SavingsCashInfoSectionProps {
  item: Investment
  /** 예적금 만기 예상 수령액 (현금이면 null) */
  maturity: SavingsMaturityResult | null
  /** 누적 납입 원금 */
  totalPaidPrincipal: number
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-border-subtle-lighter last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </div>
  )
}

/**
 * 예적금·현금 상세 정보 섹션.
 * - 예적금: 매달 금액·납입일·약정금리·만기일 + 만기 예상 수령액
 * - 현금: 매달 금액·납입일 + 누적 납입 원금
 */
export function SavingsCashInfoSection({
  item,
  maturity,
  totalPaidPrincipal,
}: SavingsCashInfoSectionProps) {
  const isSavings = item.record_type === 'savings'

  return (
    <section className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-2">
        {isSavings ? '예·적금 정보' : '현금 정보'}
      </h3>
      <div>
        <InfoRow label="매달 금액" value={formatCurrency(item.monthly_amount)} />
        <InfoRow label="납입일" value={formatInvestmentDays(item.investment_days)} />

        {isSavings && item.interest_rate != null && (
          <InfoRow label="약정 연이율" value={`${item.interest_rate}%`} />
        )}
        {isSavings && item.maturity_date && (
          <InfoRow
            label="만기일"
            value={formatFullDate(new Date(item.maturity_date))}
          />
        )}
      </div>

      {/* 예적금: 만기 예상 수령액 */}
      {isSavings && maturity && (
        <div className="mt-6 rounded-2xl bg-secondary p-5">
          <p className="text-sm text-muted-foreground mb-1">만기 예상 수령액</p>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(maturity.total)}
          </p>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>넣은 원금</span>
              <span className="tabular-nums">{formatCurrency(maturity.principal)}</span>
            </div>
            <div className="flex justify-between">
              <span>예상 이자</span>
              <span className="tabular-nums">{formatCurrency(maturity.interest)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-foreground-subtle">
            단리·세전 기준 약식 추정값이에요. 우대금리·세금은 반영되지 않아요.
          </p>
        </div>
      )}

      {/* 현금: 넣은 원금 (누적 납입액) */}
      {!isSavings && (
        <div className="mt-6 rounded-2xl bg-secondary p-5">
          <p className="text-sm text-muted-foreground mb-1">넣은 원금</p>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(totalPaidPrincipal)}
          </p>
          <p className="mt-2 text-xs text-foreground-subtle">
            납입 기록을 완료할 때마다 넣은 원금이 쌓여요.
          </p>
        </div>
      )}
    </section>
  )
}
