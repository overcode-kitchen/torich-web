'use client'

interface PeriodInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdjust: (delta: number) => void
}

export default function PeriodInput({
  value,
  onChange,
  onAdjust,
}: PeriodInputProps) {
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="3년간"
        className="w-full bg-card rounded-2xl py-3.5 px-4 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {/* 빠른 조절 버튼 */}
      <div className="flex flex-wrap gap-2 justify-start mt-2">
        <button
          type="button"
          onClick={() => onAdjust(5)}
          className="rounded-full bg-surface-strong hover:bg-surface-strong-hover text-foreground-soft font-semibold text-sm px-4 py-2 transition-colors"
        >
          +5
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-5)}
          className="rounded-full bg-surface-strong hover:bg-surface-strong-hover text-foreground-soft font-semibold text-sm px-4 py-2 transition-colors"
        >
          -5
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
