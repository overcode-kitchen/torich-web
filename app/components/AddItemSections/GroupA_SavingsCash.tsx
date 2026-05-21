'use client'

import ProgressiveField from './ProgressiveField'
import type { RecordType } from '@/app/types/investment'

interface GroupA_SavingsCashProps {
  recordType: Exclude<RecordType, 'investment'>
  title: string
  onTitleChange: (value: string) => void
}

/**
 * 예적금/현금 유형 그룹 A: 이름 입력만.
 * 유형 선택 시점에 자동 노출.
 */
export default function GroupA_SavingsCash({
  recordType,
  title,
  onTitleChange,
}: GroupA_SavingsCashProps) {
  const placeholder = recordType === 'savings' ? '예: KB Star 예금' : '예: 비상금 통장'

  return (
    <ProgressiveField label="이 항목의 이름은 무엇인가요?">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-card rounded-2xl py-3.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </ProgressiveField>
  )
}
