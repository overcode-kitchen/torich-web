'use client'

import { ArrowsLeftRight } from '@phosphor-icons/react'

interface AmountInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdjust: (delta: number) => void
  /** 주수 모드로 전환 가능한 컨텍스트일 때만 전달. 미전달 시 단위 토글 버튼은 숨김 */
  onUnitTypeToggle?: () => void
}

const QUICK_ADJUSTS: { label: string; delta: number }[] = [
  { label: '+10만', delta: 10 },
  { label: '-10만', delta: -10 },
  { label: '+1만', delta: 1 },
  { label: '-1만', delta: -1 },
]

/**
 * 적립항목 금액 입력칸. 목적 금액칸(FlowInput size="lg")과 동일한 히어로 스타일
 * (큰 글씨·가운데 정렬·오른쪽 만원 라벨)을 사용한다. 주수 전환 토글은 입력칸 아래에 둔다.
 */
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
          inputMode="numeric"
          aria-label="금액 입력 (만원 단위)"
          value={value}
          onChange={onChange}
          placeholder="0"
          className="w-full h-16 rounded-xl bg-field-bg px-4 pr-16 text-2xl font-bold text-center tracking-tight text-foreground placeholder:text-foreground-subtle border border-border-subtle focus:outline-none focus:ring-2 focus:ring-ring/60 transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-foreground-soft pointer-events-none">
          만원
        </span>
      </div>

      {/* 단위 토글(좌) + 빠른 조절 칩(우) */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {onUnitTypeToggle && (
          <button
            type="button"
            onClick={onUnitTypeToggle}
            className="mr-auto flex items-center gap-1 rounded-full bg-surface-hover hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground-soft transition-colors"
            aria-label="주수 모드로 전환"
          >
            만원
            <ArrowsLeftRight className="w-3 h-3" weight="bold" />
            주
          </button>
        )}
        {QUICK_ADJUSTS.map(({ label, delta }) => (
          <button
            key={label}
            type="button"
            onClick={() => onAdjust(delta)}
            className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
