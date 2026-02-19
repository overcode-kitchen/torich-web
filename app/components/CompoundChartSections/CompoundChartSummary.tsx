'use client'

import { formatCurrency } from '@/lib/utils'
import type { ChartDataPoint } from '@/app/hooks/chart/useCompoundChartData'

interface CompoundChartSummaryProps {
    summary: {
        principal: number
        profit: number
    }
    breakEvenPoint: ChartDataPoint | null
}

export default function CompoundChartSummary({ summary, breakEvenPoint }: CompoundChartSummaryProps) {
    return (
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
            <div className="flex items-center gap-4">
                <div>
                    <p className="text-xs text-muted-foreground mb-0.5">원금</p>
                    <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(summary.principal)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-0.5">예상 수익</p>
                    <p className="text-sm font-semibold text-foreground">
                        +{formatCurrency(summary.profit)}
                    </p>
                </div>
            </div>
            {breakEvenPoint && (
                <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">복리 역전</p>
                    <p className="text-xs font-semibold text-foreground-soft">
                        ⚡ {breakEvenPoint.month}개월
                    </p>
                </div>
            )}
        </div>
    )
}
