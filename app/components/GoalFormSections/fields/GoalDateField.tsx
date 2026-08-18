'use client'

import DateSelectField from '@/app/components/Common/DateSelectField'
import { GOAL_DEADLINE_HELP } from '@/app/utils/goal-amount'
import { startOfToday } from '@/app/utils/date'

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
 *
 * 하한은 오늘이다. 과거 마감일로 저장하면 목적이 만들어지는 순간 기간이 끝나
 * 홈 카드에 '기간 종료'가 붙고, 그 상태에서는 적립 항목을 묶을 손잡이가 사라져
 * 마감일을 다시 고치기 전까지 아무것도 넣을 수 없다. 마감일 알림도 조용히
 * 0건 예약된다. 적립 항목 종료일·예적금 만기일과 같은 규격이다(#65).
 *
 * 생성·수정이 이 필드를 함께 쓰지만 수정도 같은 하한을 둔다. 시간이 흘러
 * 자연히 지나간 마감일은 DateSelectSheet가 선택 상태로 계속 보여주므로
 * 기존 값이 사라지지 않는다 — 더 과거로 새로 고를 수만 없다.
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
        minDate={startOfToday()}
      />
      {showHelp && (
        <p className="text-caption text-foreground-subtle">{GOAL_DEADLINE_HELP}</p>
      )}
    </div>
  )
}
