'use client'

import InvestmentStartDateField from '@/app/components/AddInvestmentSections/InvestmentStartDateField'
import InvestmentDaysField from '@/app/components/AddInvestmentSections/InvestmentDaysField'
import ProgressiveField from './ProgressiveField'
import { formatInvestmentDays } from '@/app/types/investment'
import type { RecordType } from '@/app/types/investment'
import type { UseAddItemFormStateReturn } from '@/app/hooks/investment/add/useAddItemFormState'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

interface GroupC_WhenProps {
  recordType: RecordType
  investmentForm: UseAddInvestmentFormReturn
  formState: UseAddItemFormStateReturn
  /** 투자 시작일 시트 open 상태 */
  isStartDatePickerOpen: boolean
  onStartDatePickerOpenChange: (open: boolean) => void
  /** 매월 투자/납입일 시트 열기 */
  onOpenDaysPicker: () => void
}

/**
 * 그룹 C: "언제 모을까요?"
 * - 투자: 시작일(default 있음) + 매월 투자일 — 둘 다 자동 노출
 * - 예적금/현금: 납입일만 자동 노출
 */
export default function GroupC_When({
  recordType,
  investmentForm,
  formState,
  isStartDatePickerOpen,
  onStartDatePickerOpenChange,
  onOpenDaysPicker,
}: GroupC_WhenProps) {
  const isInvestment = recordType === 'investment'
  const days = isInvestment ? investmentForm.investmentDays : formState.investmentDays
  const daysLabel = isInvestment ? '매월 언제 투자할까요?' : '매월 언제 모을까요?'

  return (
    <div>
      {isInvestment && (
        <ProgressiveField label="언제부터 시작했나요?" autoScroll={false}>
          <InvestmentStartDateField
            startDate={investmentForm.startDate}
            setStartDate={investmentForm.setStartDate}
            isOpen={isStartDatePickerOpen}
            onOpenChange={onStartDatePickerOpenChange}
          />
        </ProgressiveField>
      )}

      <ProgressiveField label={daysLabel} autoScroll={isInvestment}>
        <InvestmentDaysField
          investmentDays={days}
          onOpenDaysPicker={onOpenDaysPicker}
        />
      </ProgressiveField>
    </div>
  )
}
