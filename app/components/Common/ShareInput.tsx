'use client'

interface ShareInputProps {
  value: string
  onChange: (value: string) => void
}

export default function ShareInput({ value, onChange }: ShareInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="월 1 (주 단위)"
          className="w-full bg-card rounded-2xl py-3.5 pl-4 pr-16 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          주
        </span>
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
