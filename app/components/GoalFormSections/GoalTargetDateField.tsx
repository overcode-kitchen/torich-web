'use client'

import { useState } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'
import GoalTargetDateSheet from './GoalTargetDateSheet'

interface GoalTargetDateFieldProps {
  /** YYYY-MM-DD 또는 빈 문자열 */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /** 'default': 기존 보더 스타일 | 'flow': 보더 없는 FlowInput 스타일 */
  variant?: 'default' | 'flow'
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIsoDate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export default function GoalTargetDateField({
  value,
  onChange,
  disabled,
  variant = 'default',
}: GoalTargetDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedDate = parseIsoDate(value)

  const buttonClass =
    variant === 'flow'
      ? 'w-full flex items-center justify-between bg-muted/50 rounded-xl h-12 px-4 text-base text-foreground border-0 hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring/60 transition-all disabled:opacity-50'
      : 'w-full flex items-center justify-between bg-card rounded-xl h-12 px-4 text-sm text-foreground border border-input hover:bg-surface transition-colors disabled:opacity-50'

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={buttonClass}
      >
        <span className={selectedDate ? '' : 'text-foreground-subtle'}>
          {selectedDate
            ? selectedDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '마감일 선택'}
        </span>
        <CalendarBlank className="w-4 h-4 text-foreground-subtle" />
      </button>

      {isOpen && (
        <GoalTargetDateSheet
          selectedDate={selectedDate}
          onSelect={(date) => onChange(toIsoDate(date))}
          onClear={() => onChange('')}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
