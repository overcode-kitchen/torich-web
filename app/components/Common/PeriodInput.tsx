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
      <div className="flex flex-wrap gap-2 justify-end mt-2">
        <button
          type="button"
          onClick={() => onAdjust(5)}
          className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
        >
          +5년
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-5)}
          className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
        >
          -5년
        </button>
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
        >
          +1년
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
        >
          -1년
        </button>
      </div>
    </div>
  )
}
