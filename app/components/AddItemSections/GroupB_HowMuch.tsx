'use client'

import AmountInput from '@/app/components/Common/AmountInput'
import ShareInput from '@/app/components/Common/ShareInput'
import PeriodInput from '@/app/components/Common/PeriodInput'
import DateSelectField from '@/app/components/Common/DateSelectField'
import { FlowInput } from '@/app/components/Common/FlowInput'
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
  /** 묶인 목적의 마감일(YYYY-MM-DD). 있으면 목표 기간(년) 입력 대신 종료 날짜 선택을 쓴다. */
  goalDeadline?: string
  /** 선택된 종료 날짜(기본값=목적 마감일). 사용자가 바꿀 수 있고, 비우면 무기한. */
  goalEndDate?: string
  onGoalEndDateChange?: (value: string) => void
}

const parseAmount = (raw: string): number => {
  const n = parseInt(raw.replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

/**
 * 목적에 묶인 항목의 종료 날짜 선택. 연 단위 목표 기간 입력을 대체한다.
 * - 기본값은 목적 마감일이지만, 눌러서 원하는 날짜로 바꿀 수 있다(단기 3개월 등도 자유).
 * - 비우면(삭제) 종료 없이 계속 적립. 저장 시 이 날짜가 항목의 만기로 남아, 나중에 목적에서
 *   분리해도 "언제까지 모을지"가 항목에 그대로 유지된다.
 */
function GoalEndDateField({
  goalDeadline,
  value,
  onChange,
}: {
  goalDeadline: string
  value: string
  onChange: (value: string) => void
}) {
  const onGoalDeadline = value === goalDeadline
  const helper = value
    ? onGoalDeadline
      ? '목적 마감일에 맞췄어요'
      : '직접 정한 날짜예요'
    : '종료 없이 계속 적립해요'

  return (
    <ProgressiveField label="언제까지 모을까요?">
      <DateSelectField
        value={value}
        onChange={onChange}
        variant="flow"
        placeholder="종료 날짜 선택"
        sheetTitle="언제까지 모을까요?"
        clearable
        emptyLabel="목표 기간 없이 계속 적립"
      />
      <div className="mt-2 flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted-foreground">{helper}</p>
        {!onGoalDeadline && goalDeadline && (
          <button
            type="button"
            onClick={() => onChange(goalDeadline)}
            className="shrink-0 text-xs text-foreground-subtle underline underline-offset-2 hover:text-foreground-soft transition-colors"
          >
            목적 마감일로
          </button>
        )}
      </div>
    </ProgressiveField>
  )
}

/**
 * 그룹 B: "얼마나 모을까요?"
 * - 첫 필드(금액)는 항상 노출
 * - 후속 필드는 직전 필드 충족 시 자동 노출 (다음 버튼 없이)
 *
 * 시퀀스:
 * - 투자: 금액(or 주수) → 기간(목적 마감일 있으면 종료 날짜)
 * - 예적금: 금액 → 금리 → 만기일
 * - 현금: 금액 → 기간(목적 마감일 있으면 종료 날짜)
 */
export default function GroupB_HowMuch({
  recordType,
  investmentForm,
  formState,
  goalDeadline,
  goalEndDate,
  onGoalEndDateChange,
}: GroupB_HowMuchProps) {
  if (recordType === 'investment')
    return (
      <InvestmentFields
        form={investmentForm}
        goalDeadline={goalDeadline}
        goalEndDate={goalEndDate}
        onGoalEndDateChange={onGoalEndDateChange}
      />
    )
  // 예적금은 자체 만기일 피커를 쓰므로 목적 종료 날짜를 적용하지 않는다.
  if (recordType === 'savings') return <SavingsFields formState={formState} />
  return (
    <CashFields
      formState={formState}
      goalDeadline={goalDeadline}
      goalEndDate={goalEndDate}
      onGoalEndDateChange={onGoalEndDateChange}
    />
  )
}

function InvestmentFields({
  form,
  goalDeadline,
  goalEndDate,
  onGoalEndDateChange,
}: {
  form: UseAddInvestmentFormReturn
  goalDeadline?: string
  goalEndDate?: string
  onGoalEndDateChange?: (value: string) => void
}) {
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

      {amountFilled &&
        (goalDeadline ? (
          <GoalEndDateField
            goalDeadline={goalDeadline}
            value={goalEndDate ?? ''}
            onChange={onGoalEndDateChange ?? (() => {})}
          />
        ) : (
          <ProgressiveField label="얼마나 오래 투자할까요?">
            <PeriodInput
              value={form.period}
              onChange={form.handlePeriodChange}
              onAdjust={form.adjustPeriod}
              isHabitMode={form.isHabitMode}
              onToggleHabitMode={form.setIsHabitMode}
            />
          </ProgressiveField>
        ))}
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
          <FlowInput
            inputMode="decimal"
            suffix="%"
            className="h-14 text-xl text-center font-semibold"
            value={formState.interestRate}
            onChange={formState.handleInterestRateChange}
            placeholder="예: 3.5"
          />
        </ProgressiveField>
      )}

      {rateFilled && (
        <ProgressiveField label="언제 만기인가요?">
          <DateSelectField
            value={formState.maturityDate}
            onChange={formState.setMaturityDate}
            variant="flow"
            placeholder="만기일 선택"
          />
        </ProgressiveField>
      )}
    </div>
  )
}

function CashFields({
  formState,
  goalDeadline,
  goalEndDate,
  onGoalEndDateChange,
}: {
  formState: UseAddItemFormStateReturn
  goalDeadline?: string
  goalEndDate?: string
  onGoalEndDateChange?: (value: string) => void
}) {
  const amountFilled = parseAmount(formState.monthlyAmount) > 0
  const isHabitMode = formState.periodYears === ''

  return (
    <div>
      <ProgressiveField label="매달 얼마를 모을까요?" autoScroll={false}>
        <AmountInput
          value={formState.monthlyAmount}
          onChange={formState.handleAmountChange}
          onAdjust={formState.adjustAmount}
        />
      </ProgressiveField>

      {amountFilled &&
        (goalDeadline ? (
          <GoalEndDateField
            goalDeadline={goalDeadline}
            value={goalEndDate ?? ''}
            onChange={onGoalEndDateChange ?? (() => {})}
          />
        ) : (
          <ProgressiveField label="얼마나 오래 모을까요?">
            <PeriodInput
              value={formState.periodYears}
              onChange={formState.handlePeriodYearsChange}
              onAdjust={formState.adjustPeriodYears}
              isHabitMode={isHabitMode}
              onToggleHabitMode={(habit) => {
                if (habit) formState.setPeriodYearsRaw('')
              }}
            />
          </ProgressiveField>
        ))}
    </div>
  )
}
