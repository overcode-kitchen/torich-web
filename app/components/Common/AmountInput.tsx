'use client'

import { ArrowsLeftRight } from '@phosphor-icons/react'

interface AmountInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdjust: (delta: number) => void
  /** 주수 모드로 전환 가능한 컨텍스트일 때만 전달. 미전달 시 단위 라벨은 클릭 불가 */
  onUnitTypeToggle?: () => void
}

export default function AmountInput({
  value,
  onChange,
  onAdjust,
  onUnitTypeToggle,
}: AmountInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="월 100 (만원 단위)"
          className={`w-full bg-card rounded-2xl py-3.5 pl-4 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring ${onUnitTypeToggle ? 'pr-28' : 'pr-16'}`}
        />
        {onUnitTypeToggle ? (
          <button
            type="button"
            onClick={onUnitTypeToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full bg-surface-hover hover:bg-muted px-2.5 py-1 text-xs font-medium text-foreground-soft transition-colors"
            aria-label="주수 모드로 전환"
          >
            만원
            <ArrowsLeftRight className="w-3 h-3" weight="bold" />
            주
          </button>
        ) : (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            만원
          </span>
        )}
      </div>
      {/* 빠른 조절 버튼 */}
      <div className="flex flex-wrap gap-2 justify-end mt-2">
        <button
          type="button"
          onClick={() => onAdjust(10)}
          className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
        >
          +10만
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-10)}
          className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
        >
          -10만
        </button>
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
        >
          +1만
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
        >
          -1만
        </button>
      </div>
    </div>
  )
}
