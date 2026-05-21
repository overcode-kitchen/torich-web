'use client'

import ProgressiveField from './ProgressiveField'
import type { UseAddItemFlowReturn } from '@/app/hooks/investment/add/useAddItemFlow'
import type { RecordType } from '@/app/types/investment'

interface GroupA_SavingsCashProps {
  recordType: Exclude<RecordType, 'investment'>
  title: string
  onTitleChange: (value: string) => void
  flow: UseAddItemFlowReturn
}

/**
 * 예적금/현금 유형의 그룹 A.
 * 시퀀스: recordType(상위 라우터에서 처리) → title
 *
 * 여기서는 title 입력만 progressive disclosure로 노출한다.
 */
export default function GroupA_SavingsCash({
  recordType,
  title,
  onTitleChange,
  flow,
}: GroupA_SavingsCashProps) {
  const isTitleActive = flow.visibleFieldIds.includes('title')
  const placeholder = recordType === 'savings' ? '예: KB Star 예금' : '예: 비상금 통장'

  return (
    <div className="space-y-2">
      <ProgressiveField
        label="이 항목의 이름은 무엇인가요?"
        answerSummary={title || undefined}
        isActive={isTitleActive && flow.fieldsInCurrentGroup[flow.currentFieldIndex] === 'title'}
        onEditTap={isTitleActive ? () => flow.goToGroup('A', 'title') : undefined}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-card rounded-2xl py-3.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
      </ProgressiveField>
    </div>
  )
}
