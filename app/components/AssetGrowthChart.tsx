'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import {
  generatePortfolioGrowthData,
  getMilestoneChartData,
  type ChartDataPoint,
} from '@/app/utils/finance'
import type { Investment } from '@/app/types/investment'

interface AssetGrowthChartProps {
  investments: Investment[]
  selectedYear: number
}

interface BarDataPoint extends ChartDataPoint {
  label: string
}

// 수익 막대: 상단에 총 자산, 내부에 +수익금
const RenderProfitBarLabel = (props: any) => {
  const { x, y, width, height, payload, chartColors } = props
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
const RenderPrincipalLabel = (props: any) => {
  const { x, y, width, height, chartColors } = props
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

// 커스텀 툴팁
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
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
  return null
}

export default function AssetGrowthChart({
  investments,
  selectedYear,
}: AssetGrowthChartProps) {
  const [selectedBar, setSelectedBar] = useState<BarDataPoint | null>(null)

  // CSS 변수에서 차트 색상 읽기
  const chartColors = useMemo(() => {
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

  if (investments.length === 0 || barData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-foreground-subtle">
        <p className="text-sm">투자를 추가하면 차트가 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 토리 메시지 */}
      {currentData && currentData.profit > 0 && (
        <div className="bg-muted-darker rounded-xl px-4 py-3">
          <p className="text-sm text-foreground-soft">
            🐿️ <span className="font-medium">토리:</span> "복리 효과로{' '}
            <span className="font-bold text-foreground">+{formatCurrency(currentData.profit)}</span>
            이 자라났어요"
          </p>
        </div>
      )}

      {/* 스택형 막대 차트 */}
      <div className="h-[240px] -ml-4 -mr-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{ top: 28, right: 12, left: 0, bottom: 8 }}
            barCategoryGap="20%"
            barGap={4}
            onClick={(state) => {
              const idx = state?.activeTooltipIndex ?? state?.activeIndex
              if (typeof idx === 'number' && barData[idx]) {
                setSelectedBar(barData[idx])
              }
            }}
          >
            <defs>
              <linearGradient id="barProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.profit} stopOpacity={1} />
                <stop offset="100%" stopColor={chartColors.profitDark} stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={chartColors.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={(v) => {
                if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
                if (v >= 10000) return `${Math.floor(v / 10000)}만`
                return `${v}`
              }}
              stroke={chartColors.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

            {/* 원금 (하단) - 연한 그린 틴트 */}
            <Bar
              dataKey="principal"
              stackId="a"
              fill={chartColors.principal}
              radius={[0, 0, 0, 0]}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              label={<RenderPrincipalLabel chartColors={chartColors} />}
            />

            {/* 수익 (상단, The Gap) */}
            <Bar
              dataKey="profit"
              stackId="a"
              fill="url(#barProfit)"
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              label={<RenderProfitBarLabel chartColors={chartColors} />}
            >
              {barData.map((entry, index) => (
                <Cell
                  key={`profit-${index}`}
                  fill="url(#barProfit)"
                  stroke={selectedBar?.month === entry.month ? chartColors.profitDark : 'transparent'}
                  strokeWidth={2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

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
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors.principal, border: `1px solid ${chartColors.principalText}` }}></span>
          <span className="text-foreground-muted">원금</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors.profit }}></span>
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
    </div>
  )
}
