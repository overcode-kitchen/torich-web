'use client'

import RecordTypeSelector from '@/app/components/AddInvestmentSections/RecordTypeSelector'
import ProgressiveField from './ProgressiveField'
import GroupA_Investment from './GroupA_Investment'
import GroupA_SavingsCash from './GroupA_SavingsCash'
import type { RecordType } from '@/app/types/investment'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

interface GroupA_WhatToSaveProps {
  /** 신규 진입 시 null (미선택). 선택 전에는 하위 컴포넌트가 노출되지 않는다. */
  recordType: RecordType | null
  onRecordTypeChange: (type: RecordType) => void
  /** 투자 전용 폼 (recordType==='investment'일 때만 사용) */
  investmentForm: UseAddInvestmentFormReturn
  /** 예적금/현금 공통 title state */
  title: string
  onTitleChange: (value: string) => void
  /** 투자 종목 수동 입력 모달 트리거 */
  onOpenManualInputModal: () => void
  /** 편집 모드: record_type 변경 금지 */
  isEditMode?: boolean
}

/**
 * 그룹 A: "어디에 모을까요?"
 * - 유형 선택 (세로 카드 3개) — 항상 노출
 * - 유형 선택 후 하위 컴포넌트 자동 노출 (다음 버튼 없이)
 */
export default function GroupA_WhatToSave({
  recordType,
  onRecordTypeChange,
  investmentForm,
  title,
  onTitleChange,
  onOpenManualInputModal,
  isEditMode = false,
}: GroupA_WhatToSaveProps) {
  return (
    <div>
      <ProgressiveField label="어디에 모을까요?" autoScroll={false}>
        <RecordTypeSelector
          recordType={recordType}
          onRecordTypeChange={onRecordTypeChange}
          disabled={isEditMode}
        />
      </ProgressiveField>

      {recordType === 'investment' && (
        <GroupA_Investment
          form={investmentForm}
          onOpenManualInputModal={onOpenManualInputModal}
        />
      )}
      {(recordType === 'savings' || recordType === 'cash') && (
        <GroupA_SavingsCash
          recordType={recordType}
          title={title}
          onTitleChange={onTitleChange}
        />
      )}
    </div>
  )
}
