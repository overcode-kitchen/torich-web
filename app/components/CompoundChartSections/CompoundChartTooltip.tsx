'use client'

import { formatCurrency } from '@/lib/utils'
import type { ChartDataPoint } from '@/app/hooks/useCompoundChartData'

interface CompoundChartTooltipProps {
  active?: boolean
  payload?: any[]
}

export default function CompoundChartTooltip({ active, payload }: CompoundChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload as ChartDataPoint
  const yearText = data.year > 0 ? `${data.year}년 ` : ''
  const monthText = data.month % 12 === 0 ? '' : `${data.month % 12}개월`
  const timeLabel = `${yearText}${monthText}`.trim() || `${data.month}개월`
  
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">{timeLabel}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-xs text-foreground-muted">원금</span>
          <span className="text-xs font-semibold text-foreground">
            {formatCurrency(data.principal)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-xs text-foreground-muted">예상 수익</span>
          <span className="text-xs font-semibold text-brand-600">
            +{formatCurrency(data.profit)}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-t border-border-subtle pt-1 mt-1">
          <span className="text-xs font-medium text-foreground-soft">총 자산</span>
          <span className="text-xs font-bold text-foreground">
            {formatCurrency(data.totalAsset)}
          </span>
        </div>
      </div>
    </div>
  )
}
