'use client'

import { useEffect, useRef } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'
import DateSelectSheet from '@/app/components/Common/DateSelectSheet'
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
  /** 납입일을 고치러 진입한 경우(단일 필드 편집) — 값이 이미 있어도 시트를 연다 */
  openDaysPickerOnMount?: boolean
}

const formatStartDate = (d: Date): string =>
  d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const fieldButtonClass =
  'w-full flex items-center justify-between bg-card rounded-xl h-12 px-4 text-label text-foreground border border-border-subtle hover:bg-surface transition-colors'

/**
 * 그룹 C: "언제 모으나요?"
 * - 투자: 시작일 + 매월 투자일
 * - 예적금/현금: 매월 적립일
 *
 * 각 필드는 ProgressiveField 라벨 하나 + 단순 버튼 1개로 단순화.
 */
export default function GroupC_When({
  recordType,
  investmentForm,
  formState,
  isStartDatePickerOpen,
  onStartDatePickerOpenChange,
  onOpenDaysPicker,
  openDaysPickerOnMount = false,
}: GroupC_WhenProps) {
  const isInvestment = recordType === 'investment'
  const days = isInvestment ? investmentForm.investmentDays : formState.investmentDays
  // 자동이체일·매수일은 사용자가 지금 정하는 값이 아니라 이미 정해져 있는 사실이라
  // 제안형(~할까요?)이 아니라 사실 확인형(~하나요?)으로 묻는다. 기준: docs/wording.md
  const daysLabel = isInvestment ? '매월 언제 투자하나요?' : '매월 언제 모으나요?'
  const daysButtonLabel =
    days.length > 0 ? formatInvestmentDays(days) : '날짜 선택하기'

  // 시트 자동 노출 조건 — 마운트 시 1회만 발화 (사용자가 닫고 다시 열 수 있도록).
  // - 신규: 예적금/현금은 그룹 C에 필드가 하나뿐이라 진입 즉시 띄운다.
  // - 납입일을 고치러 온 단일 필드 편집: 이미 값이 있어도 띄운다. 그 필드를 고치러
  //   들어왔는데 한 번 더 탭하게 만들 이유가 없다.
  const autoOpenedRef = useRef<boolean>(false)
  useEffect(() => {
    if (autoOpenedRef.current) return
    const shouldOpen = openDaysPickerOnMount || (!isInvestment && days.length === 0)
    if (!shouldOpen) return
    autoOpenedRef.current = true
    onOpenDaysPicker()
  }, [isInvestment, days.length, openDaysPickerOnMount, onOpenDaysPicker])

  return (
    <div>
      {isInvestment && (
        <ProgressiveField label="언제부터 시작했나요?" autoScroll={false}>
          <button
            type="button"
            onClick={() => onStartDatePickerOpenChange(true)}
            className={fieldButtonClass}
          >
            <span>{formatStartDate(investmentForm.startDate)}</span>
            <CalendarBlank className="w-4 h-4 text-foreground-subtle" />
          </button>
          {isStartDatePickerOpen && (
            <DateSelectSheet
              selectedDate={investmentForm.startDate}
              onSelect={investmentForm.setStartDate}
              onClose={() => onStartDatePickerOpenChange(false)}
              title="투자 시작일 선택"
              pastYears={30}
            />
          )}
        </ProgressiveField>
      )}

      <ProgressiveField label={daysLabel} autoScroll={isInvestment}>
        <button
          type="button"
          onClick={onOpenDaysPicker}
          className={fieldButtonClass}
        >
          <span>{daysButtonLabel}</span>
          <CalendarBlank className="w-4 h-4 text-foreground-subtle" />
        </button>
      </ProgressiveField>
    </div>
  )
}
