'use client'

import DateSelectField from '@/app/components/Common/DateSelectField'
import { GOAL_DEADLINE_HELP } from '@/app/utils/goal-amount'

interface GoalDateFieldProps {
  /** YYYY-MM-DD 또는 빈 문자열 */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /** 'flow' 보더리스(추가 위저드) | 'default' 카드 보더(수정 폼) */
  variant?: 'default' | 'flow'
  /** 필드 아래 헬프텍스트 노출 여부 */
  showHelp?: boolean
}

/**
 * 목적 마감일 입력 공용 필드 — 공용 DateSelectField + 통일된 헬프텍스트.
 */
export default function GoalDateField({
  value,
  onChange,
  disabled,
  variant = 'default',
  showHelp = true,
}: GoalDateFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <DateSelectField
        value={value}
        onChange={onChange}
        disabled={disabled}
        variant={variant}
        placeholder="마감일 선택"
        clearable
        emptyLabel="마감일 없음"
      />
      {showHelp && (
        <p className="text-xs text-foreground-subtle">{GOAL_DEADLINE_HELP}</p>
      )}
    </div>
  )
}
