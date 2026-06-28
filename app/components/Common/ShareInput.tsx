'use client'

import { ArrowsLeftRight } from '@phosphor-icons/react'

interface ShareInputProps {
  value: string
  onChange: (value: string) => void
  /** 금액 모드로 되돌릴 수 있는 컨텍스트일 때 전달 */
  onUnitTypeToggle?: () => void
}

/**
 * 주수 입력칸. AmountInput과 동일한 히어로 스타일(큰 글씨·가운데·오른쪽 단위 라벨)을
 * 사용해 만원↔주 전환 시 일관성을 유지한다.
 */
export default function ShareInput({ value, onChange, onUnitTypeToggle }: ShareInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          aria-label="주수 입력"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full h-16 rounded-xl bg-field-bg px-4 pr-16 text-2xl font-bold text-center tracking-tight text-foreground placeholder:text-foreground-subtle border border-border-subtle/50 focus:outline-none focus:ring-2 focus:ring-ring/60 transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-foreground-soft pointer-events-none">
          주
        </span>
      </div>

      {/* 단위 토글(좌) + 빠른 선택 칩(우) */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {onUnitTypeToggle && (
          <button
            type="button"
            onClick={onUnitTypeToggle}
            className="mr-auto flex items-center gap-1 rounded-full bg-surface-hover hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground-soft transition-colors"
            aria-label="금액 모드로 전환"
          >
            주
            <ArrowsLeftRight className="w-3 h-3" weight="bold" />
            만원
          </button>
        )}
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
