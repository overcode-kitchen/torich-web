'use client'

import { formatCurrency } from '@/lib/utils'
import type { BarDataPoint } from '@/app/hooks/useAssetGrowthChart'

interface AssetGrowthChartTooltipProps {
  active?: boolean
  payload?: any[]
}

export default function AssetGrowthChartTooltip({ active, payload }: AssetGrowthChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload as BarDataPoint
  const profitRatio = data.total > 0 ? ((data.profit / data.total) * 100).toFixed(1) : '0.0'

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg min-w-[160px]">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{data.label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-xs text-foreground-muted">원금</span>
          <span className="text-xs font-semibold text-foreground">
            {formatCurrency(data.principal)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-xs text-brand-600 font-medium">수익금</span>
          <span className="text-xs font-bold text-brand-600">
            +{formatCurrency(data.profit)}
          </span>
          <span className="text-xs text-muted-foreground">({profitRatio}%)</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-border-subtle pt-1.5 mt-1.5">
          <span className="text-xs font-medium text-foreground-soft">총 자산</span>
          <span className="text-xs font-bold text-foreground">
            {formatCurrency(data.total)}
          </span>
        </div>
      </div>
    </div>
  )
}
