'use client'

import AmountInput from '@/app/components/Common/AmountInput'
import ShareInput from '@/app/components/Common/ShareInput'
import PeriodInput from '@/app/components/Common/PeriodInput'
import ProgressiveField from './ProgressiveField'
import type { RecordType } from '@/app/types/investment'
import type { UseAddItemFormStateReturn } from '@/app/hooks/investment/add/useAddItemFormState'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

interface GroupB_HowMuchProps {
  recordType: RecordType
  /** 투자 유형 폼 (recordType==='investment'일 때만 사용) */
  investmentForm: UseAddInvestmentFormReturn
  /** 예적금/현금 공통 폼 */
  formState: UseAddItemFormStateReturn
}

const parseAmount = (raw: string): number => {
  const n = parseInt(raw.replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

/**
 * 그룹 B: "얼마나 모을까요?"
 * - 첫 필드(금액)는 항상 노출
 * - 후속 필드는 직전 필드 충족 시 자동 노출 (다음 버튼 없이)
 *
 * 시퀀스:
 * - 투자: 금액(or 주수) → 기간
 * - 예적금: 금액 → 금리 → 만기일
 * - 현금: 금액
 */
export default function GroupB_HowMuch({
  recordType,
  investmentForm,
  formState,
}: GroupB_HowMuchProps) {
  if (recordType === 'investment') return <InvestmentFields form={investmentForm} />
  if (recordType === 'savings') return <SavingsFields formState={formState} />
  return <CashFields formState={formState} />
}

function InvestmentFields({ form }: { form: UseAddInvestmentFormReturn }) {
  // 단위 모드(금액/주수) 전환 가능 조건: KR + 검색 선택 종목 + 수동입력 아님
  const canToggleUnit =
    form.market === 'KR' && !!form.selectedStock?.symbol && !form.isManualInput
  const amountFilled =
    form.unitType === 'shares'
      ? parseAmount(form.monthlyShares) > 0
      : parseAmount(form.monthlyAmount) > 0

  return (
    <div>
      <ProgressiveField label="매달 얼마를 투자할까요?" autoScroll={false}>
        {form.unitType === 'shares' ? (
          <ShareInput
            value={form.monthlyShares}
            onChange={form.handleSharesChange}
            onUnitTypeToggle={canToggleUnit ? () => form.setUnitType('amount') : undefined}
          />
        ) : (
          <AmountInput
            value={form.monthlyAmount}
            onChange={form.handleAmountChange}
            onAdjust={form.adjustAmount}
            onUnitTypeToggle={canToggleUnit ? () => form.setUnitType('shares') : undefined}
          />
        )}
      </ProgressiveField>

      {amountFilled && (
        <ProgressiveField label="얼마나 오래 투자할까요?">
          <PeriodInput
            value={form.period}
            onChange={form.handlePeriodChange}
            onAdjust={form.adjustPeriod}
            isHabitMode={form.isHabitMode}
            onToggleHabitMode={form.setIsHabitMode}
          />
        </ProgressiveField>
      )}
    </div>
  )
}

function SavingsFields({ formState }: { formState: UseAddItemFormStateReturn }) {
  const amountFilled = parseAmount(formState.monthlyAmount) > 0
  const rateFilled = parseFloat(formState.interestRate) > 0

  return (
    <div>
      <ProgressiveField label="매달 얼마를 모을까요?" autoScroll={false}>
        <AmountInput
          value={formState.monthlyAmount}
          onChange={formState.handleAmountChange}
          onAdjust={formState.adjustAmount}
        />
      </ProgressiveField>

      {amountFilled && (
        <ProgressiveField label="약정 연이율이 어떻게 되나요?">
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={formState.interestRate}
              onChange={formState.handleInterestRateChange}
              placeholder="예: 3.5"
              className="w-full bg-card rounded-2xl py-3.5 pl-4 pr-12 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              %
            </span>
          </div>
        </ProgressiveField>
      )}

      {rateFilled && (
        <ProgressiveField label="언제 만기인가요?">
          <input
            type="date"
            value={formState.maturityDate}
            onChange={(e) => formState.setMaturityDate(e.target.value)}
            className="w-full bg-card rounded-2xl py-3.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </ProgressiveField>
      )}
    </div>
  )
}

function CashFields({ formState }: { formState: UseAddItemFormStateReturn }) {
  return (
    <ProgressiveField label="매달 얼마를 모을까요?" autoScroll={false}>
      <AmountInput
        value={formState.monthlyAmount}
        onChange={formState.handleAmountChange}
        onAdjust={formState.adjustAmount}
      />
    </ProgressiveField>
  )
}
