'use client'

import { useCompoundChartData } from '@/app/hooks/useCompoundChartData'
import type { Investment } from '@/app/types/investment'
import CompoundChartSummary from './CompoundChartSummary'
import CompoundChartGraph from './CompoundChartGraph'

interface CompoundChartProps {
  investments: Investment[]
  selectedYear: number
  totalMonthlyPayment: number
}

export default function CompoundChart({
  investments,
  selectedYear,
  totalMonthlyPayment,
}: CompoundChartProps) {
  const { chartData, summary, breakEvenPoint, chartColors } = useCompoundChartData({
    investments,
    selectedYear,
    totalMonthlyPayment,
  })

  // 빈 상태
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-foreground-subtle">
        <p className="text-sm">투자를 추가하면 차트가 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 차트 영역 */}
      <CompoundChartGraph
        chartData={chartData}
        chartColors={chartColors}
        breakEvenPoint={breakEvenPoint || null}
      />

      {/* 하단 요약 정보 */}
      <CompoundChartSummary
        summary={summary}
        breakEvenPoint={breakEvenPoint || null}
      />
    </div>
  )
}
