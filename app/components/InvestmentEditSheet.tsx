'use client'

import { cn } from '@/lib/utils'

export type RateSuggestion = {
  label: string
  rate: number
}

interface InvestmentEditSheetProps {
  suggestions: RateSuggestion[]
  onSelect: (rate: number) => void
  className?: string
}

function formatRate(rate: number) {
  // 20, 12.3, 8.56 형태로 표시 (최대 2자리, trailing 0 제거)
  const fixed = rate.toFixed(2)
  return fixed.replace(/\.?0+$/, '')
}

export default function InvestmentEditSheet({
  suggestions,
  onSelect,
  className,
}: InvestmentEditSheetProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {suggestions.map((s) => (
        <button
          key={`${s.label}-${s.rate}`}
          type="button"
          onClick={() => onSelect(s.rate)}
          className="rounded-full bg-coolgray-50 text-sm text-coolgray-700 px-3 py-1.5 active:bg-coolgray-100 whitespace-nowrap transition-colors"
          aria-label={`${s.label} 적용 (${formatRate(s.rate)}%)`}
        >
          {s.label.replace('{rate}', `${formatRate(s.rate)}%`)}
        </button>
      ))}
    </div>
  )
}

