'use client'

interface AmountInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdjust: (delta: number) => void
}

export default function AmountInput({
  value,
  onChange,
  onAdjust,
}: AmountInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="월 100 (만원 단위)"
          className="w-full bg-card rounded-2xl py-3.5 pl-4 pr-16 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          만원
        </span>
      </div>
      {/* 빠른 조절 버튼 */}
      <div className="flex flex-wrap gap-2 justify-start mt-2">
        <button
          type="button"
          onClick={() => onAdjust(10)}
          className="rounded-full bg-surface-strong hover:bg-surface-strong-hover text-foreground-soft font-semibold text-sm px-4 py-2 transition-colors"
        >
          +10
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-10)}
          className="rounded-full bg-surface-strong hover:bg-surface-strong-hover text-foreground-soft font-semibold text-sm px-4 py-2 transition-colors"
        >
          -10
        </button>
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="rounded-full bg-surface-strong hover:bg-surface-strong-hover text-foreground-soft font-semibold text-sm px-4 py-2 transition-colors"
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="rounded-full bg-surface-strong hover:bg-surface-strong-hover text-foreground-soft font-semibold text-sm px-4 py-2 transition-colors"
        >
          -1
        </button>
      </div>
    </div>
  )
}
