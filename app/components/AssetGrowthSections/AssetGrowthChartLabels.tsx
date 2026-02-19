'use client'

import { formatCurrency } from '@/lib/utils'
import type { ChartColors } from '@/app/hooks/chart/useChartColors'

interface LabelProps {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: any
  chartColors: ChartColors
}

// 수익 막대: 상단에 총 자산, 내부에 +수익금
export function RenderProfitBarLabel({ x, y, width, height, payload, chartColors }: LabelProps) {
  const cx = (x || 0) + (width || 0) / 2
  return (
    <g>
      {payload?.total && (
        <text
          x={cx}
          y={(y || 0) - 6}
          textAnchor="middle"
          fill={chartColors?.totalText || '#191f28'}
          fontSize={12}
          fontWeight={700}
        >
          {formatCurrency(payload.total)}
        </text>
      )}
      {payload?.profit && (height || 0) >= 16 && (
        <text
          x={cx}
          y={(y || 0) + (height || 0) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={11}
          fontWeight={600}
        >
          +{formatCurrency(payload.profit)}
        </text>
      )}
    </g>
  )
}

// 원금 막대 내부 라벨 (공간 충분할 때)
export function RenderPrincipalLabel({ x, y, width, height, chartColors }: LabelProps) {
  if ((height || 0) < 24) return null
  return (
    <text
      x={(x || 0) + (width || 0) / 2}
      y={(y || 0) + (height || 0) / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={chartColors?.principalText || '#16a34a'}
      fontSize={10}
    >
      원금
    </text>
  )
}
