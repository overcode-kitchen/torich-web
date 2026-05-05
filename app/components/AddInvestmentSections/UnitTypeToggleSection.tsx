'use client'

import type { InvestmentUnitType } from '@/app/types/investment'

interface UnitTypeToggleSectionProps {
  unitType: InvestmentUnitType
  onUnitTypeChange: (unit: InvestmentUnitType) => void
}

export default function UnitTypeToggleSection({
  unitType,
  onUnitTypeChange,
}: UnitTypeToggleSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-1 bg-secondary p-1 rounded-lg mb-6">
      <button
        type="button"
        onClick={() => onUnitTypeChange('amount')}
        className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          unitType === 'amount'
            ? 'bg-card dark:bg-surface-strong-hover text-foreground shadow-sm'
            : 'text-foreground-soft hover:text-foreground'
        }`}
      >
        💰 금액
      </button>
      <button
        type="button"
        onClick={() => onUnitTypeChange('shares')}
        className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          unitType === 'shares'
            ? 'bg-card dark:bg-surface-strong-hover text-foreground shadow-sm'
            : 'text-foreground-soft hover:text-foreground'
        }`}
      >
        📊 주수
      </button>
    </div>
  )
}
