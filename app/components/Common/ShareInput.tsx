'use client'

import { ArrowsLeftRight } from '@phosphor-icons/react'

interface ShareInputProps {
  value: string
  onChange: (value: string) => void
  /** 금액 모드로 되돌릴 수 있는 컨텍스트일 때 전달 */
  onUnitTypeToggle?: () => void
}

export default function ShareInput({ value, onChange, onUnitTypeToggle }: ShareInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="월 1 (주 단위)"
          className={`w-full bg-card rounded-2xl py-3.5 pl-4 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring ${onUnitTypeToggle ? 'pr-28' : 'pr-16'}`}
        />
        {onUnitTypeToggle ? (
          <button
            type="button"
            onClick={onUnitTypeToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full bg-surface-hover hover:bg-muted px-2.5 py-1 text-xs font-medium text-foreground-soft transition-colors"
            aria-label="금액 모드로 전환"
          >
            주
            <ArrowsLeftRight className="w-3 h-3" weight="bold" />
            만원
          </button>
        ) : (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            주
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-end mt-2">
        {[1, 5, 10].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(String(preset))}
            className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
          >
            {preset}주
          </button>
        ))}
      </div>
    </div>
  )
}
