import { useMemo, useState } from 'react'
import {
  generatePortfolioGrowthData,
  getMilestoneChartData,
  type ChartDataPoint,
} from '@/app/utils/finance'
import type { Investment } from '@/app/types/investment'

export interface BarDataPoint extends ChartDataPoint {
  label: string
}

interface UseAssetGrowthChartProps {
  investments: Investment[]
  selectedYear: number
}

export function useAssetGrowthChart({ investments, selectedYear }: UseAssetGrowthChartProps) {
  const [selectedBar, setSelectedBar] = useState<BarDataPoint | null>(null)

  const barData = useMemo(() => {
    if (investments.length === 0) return []

    const portfolioData = investments.map((inv) => ({
      monthly_amount: inv.monthly_amount,
      annual_rate: inv.annual_rate || 10,
      period_years: inv.period_years,
    }))

    const fullData = generatePortfolioGrowthData(portfolioData, selectedYear)
    const milestones = getMilestoneChartData(fullData, selectedYear)

    return milestones.map((d) => ({
      ...d,
      label: `${d.month / 12}년 후`,
    })) as BarDataPoint[]
  }, [investments, selectedYear])

  const currentData = barData.length > 0 ? barData[barData.length - 1] : null

  const handleBarClick = (state: any) => {
    const idx = state?.activeTooltipIndex ?? state?.activeIndex
    if (typeof idx === 'number' && barData[idx]) {
      setSelectedBar(barData[idx])
    }
  }

  return {
    barData,
    currentData,
    selectedBar,
    setSelectedBar,
    handleBarClick,
    hasData: investments.length > 0 && barData.length > 0,
  }
}
