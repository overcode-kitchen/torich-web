import { useMemo } from 'react'

export interface ChartColors {
  profit: string
  profitDark: string
  principal: string
  principalText: string
  grid: string
  axis: string
  totalText: string
}

/** 차트 폴백 색 — CSS 토큰을 먼저 읽고 실패 시에만 쓰는 근사치. 케이싱은 대문자로 통일한다.
 *  값은 기존과 동일(색 변화 없음), 흩어져 있던 리터럴을 한곳으로 모았다. */
const CHART_FALLBACK = {
  profit: '#22C55E',
  profitDark: '#16A34A',
  principal: '#BBF7D0',
  principalText: '#16A34A',
  grid: '#E6E7E8',
  axis: '#9C9EA6',
  totalText: '#191F28',
} as const

export function useChartColors(): ChartColors {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return { ...CHART_FALLBACK }
    }

    const root = getComputedStyle(document.documentElement)
    const profit = root.getPropertyValue('--chart-profit').trim() || CHART_FALLBACK.profit
    const principal = root.getPropertyValue('--chart-principal').trim() || CHART_FALLBACK.principal
    const axis = root.getPropertyValue('--foreground-subtle').trim() || CHART_FALLBACK.axis
    const grid = root.getPropertyValue('--border-subtle').trim() || CHART_FALLBACK.grid
    const totalText = root.getPropertyValue('--foreground').trim() || CHART_FALLBACK.totalText

    return {
      profit,
      profitDark: profit,
      principal,
      principalText: principal,
      grid,
      axis,
      totalText,
    }
  }, [])
}
