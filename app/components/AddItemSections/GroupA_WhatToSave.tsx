'use client'

import RecordTypeSelector from '@/app/components/AddInvestmentSections/RecordTypeSelector'
import GroupA_Investment from './GroupA_Investment'
import GroupA_SavingsCash from './GroupA_SavingsCash'
import type { RecordType } from '@/app/types/investment'
import type { UseAddItemFlowReturn } from '@/app/hooks/investment/add/useAddItemFlow'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

interface GroupA_WhatToSaveProps {
  recordType: RecordType
  onRecordTypeChange: (type: RecordType) => void
  /** 투자 전용 폼 (recordType==='investment'일 때만 사용) */
  investmentForm: UseAddInvestmentFormReturn
  /** 예적금/현금 공통 title state */
  title: string
  onTitleChange: (value: string) => void
  flow: UseAddItemFlowReturn
  /** 투자 종목 수동 입력 모달 트리거 */
  onOpenManualInputModal: () => void
}

/**
 * 그룹 A 라우터: RecordTypeSelector + 유형별 하위 컴포넌트 분기.
 * 모든 진입 시점에 RecordTypeSelector는 항상 노출되며, type 변경은
 * useAddItemResetPolicy가 후속 그룹 폐기 + 토스트를 처리한다.
 */
export default function GroupA_WhatToSave({
  recordType,
  onRecordTypeChange,
  investmentForm,
  title,
  onTitleChange,
  flow,
  onOpenManualInputModal,
}: GroupA_WhatToSaveProps) {
  return (
    <div className="space-y-6">
      <RecordTypeSelector
        recordType={recordType}
        onRecordTypeChange={onRecordTypeChange}
      />

      {recordType === 'investment' ? (
        <GroupA_Investment
          form={investmentForm}
          flow={flow}
          onOpenManualInputModal={onOpenManualInputModal}
        />
      ) : (
        <GroupA_SavingsCash
          recordType={recordType}
          title={title}
          onTitleChange={onTitleChange}
          flow={flow}
        />
      )}
    </div>
  )
}
