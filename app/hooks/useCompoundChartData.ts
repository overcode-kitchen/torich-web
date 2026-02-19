'use client'

import { useMemo } from 'react'
import type { Investment } from '@/app/types/investment'
import {
  generateCompoundChartData,
  calculateChartSummary,
  findBreakEvenPoint,
  type ChartDataPoint,
  type ChartSummary,
} from '@/app/utils/compound-chart'

export type { ChartDataPoint, ChartSummary }

export interface ChartColors {
  grid: string
  axis: string
  principal: string
  totalAsset: string
  profit: string
  breakEven: string
}

interface UseCompoundChartDataProps {
  investments: Investment[]
  selectedYear: number
  totalMonthlyPayment: number
}

export function useCompoundChartData({
  investments,
  selectedYear,
  totalMonthlyPayment,
}: UseCompoundChartDataProps) {
  // 차트 데이터 생성
  const chartData = useMemo(
    () => generateCompoundChartData(investments, selectedYear, totalMonthlyPayment),
    [investments, selectedYear, totalMonthlyPayment]
  )

  // 하단 요약 정보
  const summary = useMemo<ChartSummary>(
    () => calculateChartSummary(chartData),
    [chartData]
  )

  // 복리 역전 포인트 찾기
  const breakEvenPoint = useMemo(
    () => findBreakEvenPoint(chartData),
    [chartData]
  )

  // 차트 색상
  const chartColors = useMemo<ChartColors>(() => {
    if (typeof window === 'undefined') {
      return {
        grid: '#E6E7E8',
        axis: '#9C9EA6',
        principal: '#9C9EA6',
        totalAsset: '#16A34A',
        profit: '#15803D',
        breakEven: '#16A34A',
      }
    }
    const root = getComputedStyle(document.documentElement)
    const axis = root.getPropertyValue('--foreground-subtle').trim() || '#9C9EA6'
    const grid = root.getPropertyValue('--border-subtle').trim() || '#E6E7E8'
    const profitLine = root.getPropertyValue('--chart-profit').trim() || '#16A34A'
    const principalLine = root.getPropertyValue('--foreground-subtle').trim() || '#9C9EA6'

    return {
      grid,
      axis,
      principal: principalLine,
      totalAsset: profitLine,
      profit: profitLine,
      breakEven: profitLine,
    }
  }, [])

  return {
    chartData,
    summary,
    breakEvenPoint: breakEvenPoint ?? null,
    chartColors,
  }
}
