'use client'

import { InvestmentField } from '@/app/components/Common/InvestmentField'
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
  /** 정보 행을 탭하면 호출. 미지정 시 행은 정적 표시. */
  onFieldTap?: (field: string) => void
  /** 탭 스크롤용 ref */
  infoRef?: React.RefObject<HTMLElement | null>
}

interface TappableFieldProps {
  label: string
  value: string
  onTap?: () => void
}

function TappableField({ label, value, onTap }: TappableFieldProps) {
  const field = <InvestmentField label={label} value={value} isEditMode={false} />
  if (!onTap) return field
  return (
    <button
      type="button"
      onClick={onTap}
      className="block w-full text-left rounded-lg -mx-2 px-2 py-1 hover:bg-muted/30 transition-colors"
    >
      {field}
    </button>
  )
}

/**
 * 예적금·현금 상세 정보 섹션. 주식 상세의 InfoSection과 동일한 마크업 규약(InvestmentField + space-y-6)을 따른다.
 * - 예적금: 매달 금액·납입일·약정 연이율·만기일 + 만기 예상 수령액 카드
 * - 현금: 매달 금액·납입일 + 넣은 원금 카드
 * - onFieldTap 제공 시 각 행이 탭 가능 (편집 진입)
 */
export function SavingsCashInfoSection({
  item,
  maturity,
  totalPaidPrincipal,
  onFieldTap,
  infoRef,
}: SavingsCashInfoSectionProps) {
  const isSavings = item.record_type === 'savings'
  const tap = (field: string): (() => void) | undefined =>
    onFieldTap ? () => onFieldTap(field) : undefined

  return (
    <section ref={infoRef} className="py-8">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        적립 정보
      </h3>
      <div className="space-y-6">
        <TappableField
          label="매달 금액"
          value={formatCurrency(item.monthly_amount)}
          onTap={tap('monthlyAmount')}
        />
        <TappableField
          label="납입일"
          value={formatInvestmentDays(item.investment_days)}
          onTap={tap('investmentDays')}
        />
        {isSavings && item.interest_rate != null && (
          <TappableField
            label="약정 연이율"
            value={`${item.interest_rate}%`}
            onTap={tap('interestRate')}
          />
        )}
        {isSavings && item.maturity_date && (
          <TappableField
            label="만기일"
            value={formatFullDate(new Date(item.maturity_date))}
            onTap={tap('maturityDate')}
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

    </section>
  )
}
