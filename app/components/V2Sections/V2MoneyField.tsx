'use client'

import { fmt } from '@/app/utils/goal-format'

export interface V2MoneyFieldProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  unit?: string
  /** 자주 쓰는 값 바로가기. 타이핑 없이 한 번에 채운다. */
  presets?: number[]
  presetLabel?: (value: number) => string
  autoFocus?: boolean
}

/**
 * 은행 적금 상세 페이지식 입력 한 줄 — 라벨 위, 큰 숫자 아래.
 * 값을 직접 받고 직접 올려보내는 제어 컴포넌트다(상태는 페이지의 훅이 갖는다).
 */
export default function V2MoneyField({
  id,
  label,
  value,
  onChange,
  placeholder = '0',
  unit = '원',
  presets,
  presetLabel,
  autoFocus,
}: V2MoneyFieldProps) {
  return (
    <div className="flex flex-col gap-2 py-4">
      <label htmlFor={id} className="text-caption text-muted-foreground">
        {label}
      </label>
      <div className="flex items-baseline gap-2">
        <input
          id={id}
          inputMode="numeric"
          autoFocus={autoFocus}
          value={value ? fmt(value) : ''}
          placeholder={placeholder}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
          className="min-w-0 flex-1 bg-transparent text-title font-bold tabular-nums text-foreground outline-none placeholder:font-normal placeholder:text-placeholder"
        />
        <span className="shrink-0 text-label font-medium text-muted-foreground">{unit}</span>
      </div>
      {presets && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              aria-pressed={value === preset}
              className="rounded-full bg-surface px-3 py-1.5 text-caption text-muted-foreground transition-colors aria-pressed:bg-brand-accent-bg aria-pressed:font-bold aria-pressed:text-brand-accent-text"
            >
              {presetLabel ? presetLabel(preset) : fmt(preset)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
