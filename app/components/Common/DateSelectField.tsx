'use client'

import { useState } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'
import DateSelectSheet from './DateSelectSheet'

interface DateSelectFieldProps {
  /** YYYY-MM-DD 또는 빈 문자열 */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /** 'default': 카드 보더 스타일 | 'flow': 보더 없는 FlowInput 스타일 */
  variant?: 'default' | 'flow'
  /** 미선택 시 버튼에 표시할 문구 */
  placeholder?: string
  /** 시트 헤더 제목 (기본: placeholder) */
  sheetTitle?: string
  /** true면 시트에서 날짜 비우기(삭제) 허용 */
  clearable?: boolean
  /** clearable일 때 미선택 푸터 문구 */
  emptyLabel?: string
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

/**
 * 서비스 공용 날짜 선택 필드.
 * 버튼을 누르면 년/월 드롭다운이 포함된 공용 달력 시트가 열린다.
 */
export default function DateSelectField({
  value,
  onChange,
  disabled,
  variant = 'default',
  placeholder = '날짜 선택',
  sheetTitle,
  clearable = false,
  emptyLabel,
}: DateSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedDate = parseIsoDate(value)

  const buttonClass =
    variant === 'flow'
      ? 'w-full flex items-center justify-between bg-field-bg rounded-xl h-12 px-4 text-base text-foreground border border-border-subtle hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-ring/60 transition-all disabled:opacity-50'
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
            : placeholder}
        </span>
        <CalendarBlank className="w-4 h-4 text-foreground-subtle" />
      </button>

      {isOpen && (
        <DateSelectSheet
          selectedDate={selectedDate}
          title={sheetTitle ?? placeholder}
          emptyLabel={emptyLabel}
          onSelect={(date) => onChange(toIsoDate(date))}
          onClear={clearable ? () => onChange('') : undefined}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
