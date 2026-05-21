'use client'

import AmountInput from '@/app/components/Common/AmountInput'
import PeriodInput from '@/app/components/Common/PeriodInput'
import ProgressiveField from './ProgressiveField'
import type { RecordType } from '@/app/types/investment'
import type { UseAddItemFlowReturn } from '@/app/hooks/investment/add/useAddItemFlow'
import type { UseAddItemFormStateReturn } from '@/app/hooks/investment/add/useAddItemFormState'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

interface GroupB_HowMuchProps {
  recordType: RecordType
  flow: UseAddItemFlowReturn
  /** 투자 유형 폼 (recordType==='investment'일 때만 사용) */
  investmentForm: UseAddInvestmentFormReturn
  /** 예적금/현금 공통 폼 */
  formState: UseAddItemFormStateReturn
}

const formatAmount = (v: string): string | undefined =>
  v ? `${v} 만원` : undefined
const formatPeriod = (v: string, habit: boolean): string | undefined =>
  habit ? '목표 기간 없이 적립 중' : v ? `${v}년` : undefined
const formatRate = (v: string): string | undefined => (v ? `연 ${v}%` : undefined)
const formatMaturity = (v: string): string | undefined =>
  v
    ? new Date(v).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined

/**
 * 그룹 B: "얼마를 모을까요?" 진행. record_type별 필드 시퀀스가 다르다.
 * - 투자: monthlyAmount → period
 * - 예적금: monthlyAmount → interestRate → maturityDate
 * - 현금: monthlyAmount
 *
 * "다음" 버튼은 page.tsx의 공통 푸터가 담당하며, 여기서는 progressive disclosure 필드만 렌더한다.
 */
export default function GroupB_HowMuch({
  recordType,
  flow,
  investmentForm,
  formState,
}: GroupB_HowMuchProps) {
  const activeField = flow.fieldsInCurrentGroup[flow.currentFieldIndex]
  const isVisible = (id: string): boolean => flow.visibleFieldIds.includes(id)
  const isInvestment = recordType === 'investment'

  // 투자 vs 예적금/현금: monthlyAmount 입력 소스가 다르다.
  const amountValue = isInvestment ? investmentForm.monthlyAmount : formState.monthlyAmount
  const onAmountChange = isInvestment
    ? investmentForm.handleAmountChange
    : formState.handleAmountChange
  const onAmountAdjust = isInvestment ? investmentForm.adjustAmount : formState.adjustAmount

  return (
    <div className="space-y-2">
      {isVisible('monthlyAmount') && (
        <ProgressiveField
          label={isInvestment ? '매달 얼마를 투자할까요?' : '매달 얼마를 모을까요?'}
          answerSummary={formatAmount(amountValue)}
          isActive={activeField === 'monthlyAmount'}
          onEditTap={() => flow.goToGroup('B', 'monthlyAmount')}
        >
          <AmountInput
            value={amountValue}
            onChange={onAmountChange}
            onAdjust={onAmountAdjust}
          />
        </ProgressiveField>
      )}

      {isInvestment && isVisible('period') && (
        <ProgressiveField
          label="얼마나 오래 투자할까요?"
          answerSummary={formatPeriod(investmentForm.period, investmentForm.isHabitMode)}
          isActive={activeField === 'period'}
          onEditTap={() => flow.goToGroup('B', 'period')}
        >
          <PeriodInput
            value={investmentForm.period}
            onChange={investmentForm.handlePeriodChange}
            onAdjust={investmentForm.adjustPeriod}
            isHabitMode={investmentForm.isHabitMode}
            onToggleHabitMode={investmentForm.setIsHabitMode}
          />
        </ProgressiveField>
      )}

      {recordType === 'savings' && isVisible('interestRate') && (
        <ProgressiveField
          label="약정 연이율이 어떻게 되나요?"
          answerSummary={formatRate(formState.interestRate)}
          isActive={activeField === 'interestRate'}
          onEditTap={() => flow.goToGroup('B', 'interestRate')}
        >
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={formState.interestRate}
              onChange={formState.handleInterestRateChange}
              placeholder="예: 3.5"
              autoFocus
              className="w-full bg-card rounded-2xl py-3.5 pl-4 pr-12 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              %
            </span>
          </div>
        </ProgressiveField>
      )}

      {recordType === 'savings' && isVisible('maturityDate') && (
        <ProgressiveField
          label="언제 만기인가요?"
          answerSummary={formatMaturity(formState.maturityDate)}
          isActive={activeField === 'maturityDate'}
          onEditTap={() => flow.goToGroup('B', 'maturityDate')}
        >
          <input
            type="date"
            value={formState.maturityDate}
            onChange={(e) => formState.setMaturityDate(e.target.value)}
            autoFocus
            className="w-full bg-card rounded-2xl py-3.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </ProgressiveField>
      )}
    </div>
  )
}
