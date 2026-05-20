'use client'

import type { RecordType } from '@/app/types/investment'

interface RecordTypeSelectorProps {
  recordType: RecordType
  onRecordTypeChange: (type: RecordType) => void
}

const OPTIONS: { value: RecordType; label: string }[] = [
  { value: 'investment', label: '투자' },
  { value: 'savings', label: '예·적금' },
  { value: 'cash', label: '현금' },
]

/**
 * /add 화면 최상단 적립 항목 유형 선택 세그먼트 컨트롤.
 * 투자 / 예·적금 / 현금 3종.
 */
export default function RecordTypeSelector({
  recordType,
  onRecordTypeChange,
}: RecordTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1 bg-secondary p-1 rounded-lg mb-6">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onRecordTypeChange(option.value)}
          className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            recordType === option.value
              ? 'bg-card dark:bg-surface-strong-hover text-foreground shadow-sm'
              : 'text-foreground-soft hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
