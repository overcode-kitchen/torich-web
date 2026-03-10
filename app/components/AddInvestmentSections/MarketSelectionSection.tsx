'use client'

interface MarketSelectionSectionProps {
  market: 'KR' | 'US'
  onMarketChange: (market: 'KR' | 'US') => void
}

export default function MarketSelectionSection({ market, onMarketChange }: MarketSelectionSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-1 bg-secondary p-1 rounded-lg mb-6">
      <button
        type="button"
        onClick={() => onMarketChange('KR')}
        className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          market === 'KR'
            ? 'bg-card dark:bg-surface-strong-hover text-foreground shadow-sm'
            : 'text-foreground-soft hover:text-foreground'
        }`}
      >
        🇰🇷 국내 주식
      </button>
      <button
        type="button"
        onClick={() => onMarketChange('US')}
        className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          market === 'US'
            ? 'bg-card dark:bg-surface-strong-hover text-foreground shadow-sm'
            : 'text-foreground-soft hover:text-foreground'
        }`}
      >
        🇺🇸 미국 주식
      </button>
    </div>
  )
}
