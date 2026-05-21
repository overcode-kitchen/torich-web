'use client'

import InvestmentStartDateField from '@/app/components/AddInvestmentSections/InvestmentStartDateField'
import InvestmentDaysField from '@/app/components/AddInvestmentSections/InvestmentDaysField'
import ProgressiveField from './ProgressiveField'
import { formatInvestmentDays } from '@/app/types/investment'
import type { RecordType } from '@/app/types/investment'
import type { UseAddItemFlowReturn } from '@/app/hooks/investment/add/useAddItemFlow'
import type { UseAddItemFormStateReturn } from '@/app/hooks/investment/add/useAddItemFormState'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

interface GroupC_WhenProps {
  recordType: RecordType
  flow: UseAddItemFlowReturn
  investmentForm: UseAddInvestmentFormReturn
  formState: UseAddItemFormStateReturn
  /** 투자 시작일 시트 open 상태 */
  isStartDatePickerOpen: boolean
  onStartDatePickerOpenChange: (open: boolean) => void
  /** 매월 투자/납입일 시트 열기 */
  onOpenDaysPicker: () => void
}

const formatStartDate = (d: Date): string =>
  d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

/**
 * 그룹 C: "언제 모을까요?" 진행. record_type별로 시퀀스가 다르다.
 * - 투자: startDate → investmentDays
 * - 예적금/현금: investmentDays
 *
 * 최종 "저장하기" / "나중에 할게요" 버튼은 page.tsx의 공통 푸터가 담당한다.
 */
export default function GroupC_When({
  recordType,
  flow,
  investmentForm,
  formState,
  isStartDatePickerOpen,
  onStartDatePickerOpenChange,
  onOpenDaysPicker,
}: GroupC_WhenProps) {
  const activeField = flow.fieldsInCurrentGroup[flow.currentFieldIndex]
  const isVisible = (id: string): boolean => flow.visibleFieldIds.includes(id)
  const isInvestment = recordType === 'investment'
  const days = isInvestment ? investmentForm.investmentDays : formState.investmentDays
  const daysSummary = days.length > 0 ? formatInvestmentDays(days) : undefined
  const daysLabel = isInvestment ? '매월 언제 투자할까요?' : '매월 언제 모을까요?'

  return (
    <div className="space-y-2">
      {isInvestment && isVisible('startDate') && (
        <ProgressiveField
          label="언제부터 시작했나요?"
          answerSummary={formatStartDate(investmentForm.startDate)}
          isActive={activeField === 'startDate'}
          onEditTap={() => flow.goToGroup('C', 'startDate')}
        >
          <InvestmentStartDateField
            startDate={investmentForm.startDate}
            setStartDate={investmentForm.setStartDate}
            isOpen={isStartDatePickerOpen}
            onOpenChange={onStartDatePickerOpenChange}
          />
        </ProgressiveField>
      )}

      {isVisible('investmentDays') && (
        <ProgressiveField
          label={daysLabel}
          answerSummary={daysSummary}
          isActive={activeField === 'investmentDays'}
          onEditTap={() => flow.goToGroup('C', 'investmentDays')}
        >
          <InvestmentDaysField
            investmentDays={days}
            onOpenDaysPicker={onOpenDaysPicker}
          />
        </ProgressiveField>
      )}
    </div>
  )
}
