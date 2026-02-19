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

export function useChartColors(): ChartColors {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        profit: '#22C55E',
        profitDark: '#16A34A',
        principal: '#BBF7D0',
        principalText: '#16a34a',
        grid: '#E6E7E8',
        axis: '#9C9EA6',
        totalText: '#191f28',
      }
    }
    
    const root = getComputedStyle(document.documentElement)
    const profit = root.getPropertyValue('--chart-profit').trim() || '#22C55E'
    const principal = root.getPropertyValue('--chart-principal').trim() || '#BBF7D0'
    const axis = root.getPropertyValue('--foreground-subtle').trim() || '#9C9EA6'
    const grid = root.getPropertyValue('--border-subtle').trim() || '#E6E7E8'
    const totalText = root.getPropertyValue('--foreground').trim() || '#191f28'

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
