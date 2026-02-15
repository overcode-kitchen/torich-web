'use client'

import { formatCurrency } from '@/lib/utils'
import type { BarDataPoint } from '@/app/hooks/useAssetGrowthChart'
import type { ChartColors } from '@/app/hooks/useChartColors'

interface AssetGrowthChartSummaryProps {
  currentData: BarDataPoint | null
  selectedBar: BarDataPoint | null
  chartColors: ChartColors
}

export default function AssetGrowthChartSummary({ 
  currentData, 
  selectedBar, 
  chartColors 
}: AssetGrowthChartSummaryProps) {
  return (
    <>
      {/* 막대 클릭 시 상세 정보 */}
      {selectedBar && (
        <div className="bg-surface rounded-xl px-4 py-3 border border-border-subtle">
          <p className="text-xs text-muted-foreground mb-1.5">{selectedBar.label} 상세</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-foreground-soft">
              원금 <strong className="text-foreground">{formatCurrency(selectedBar.principal)}</strong>
            </span>
            <span className="text-foreground-soft font-semibold">
              수익 +{formatCurrency(selectedBar.profit)} (
              {selectedBar.total > 0
                ? ((selectedBar.profit / selectedBar.total) * 100).toFixed(1)
                : 0}
              %)
            </span>
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <span 
            className="w-3 h-3 rounded-sm" 
            style={{ 
              backgroundColor: chartColors.principal, 
              border: `1px solid ${chartColors.principalText}` 
            }}
          />
          <span className="text-foreground-muted">원금</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: chartColors.profit }}
          />
          <span className="text-foreground-muted">수익금 (The Gap)</span>
        </div>
      </div>

      {/* 하단 요약 */}
      {currentData && (
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">원금</p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(currentData.principal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">수익금</p>
              <p className="text-base font-bold text-foreground">
                +{formatCurrency(currentData.profit)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
