'use client'

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
import { formatSignedProfit } from '@/lib/utils'
import { useChartColors } from '@/app/hooks/chart/useChartColors'
import AssetGrowthChartTooltip from '@/app/components/AssetGrowthSections/AssetGrowthChartTooltip'
import AssetGrowthChartSummary from '@/app/components/AssetGrowthSections/AssetGrowthChartSummary'
import { RenderProfitBarLabel, RenderPrincipalLabel } from '@/app/components/AssetGrowthSections/AssetGrowthChartLabels'
import { BarDataPoint } from '@/app/hooks/chart/useAssetGrowthChart'

type AssetGrowthChartProps = {
  /** 상단 드롭다운과 동일 — 메시지에 연도 맥락으로 사용 */
  selectedYear: number
  barData: BarDataPoint[]
  currentData: any
  selectedBar: BarDataPoint | null
  setSelectedBar: (bar: BarDataPoint | null) => void
  handleBarClick: (state: any) => void
  hasData: boolean
}

export default function AssetGrowthChart({
  selectedYear,
  barData,
  currentData,
  selectedBar,
  setSelectedBar,
  handleBarClick,
  hasData,
}: AssetGrowthChartProps) {
  const chartColors = useChartColors()

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-foreground-subtle">
        <p className="text-sm">투자를 추가하면 차트가 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 예상 수익 인사이트: N년 드롭다운과 문구 연동, 확정·과거형 회피 */}
      {currentData && currentData.profit > 0 && (
        <div className="rounded-xl border border-border-subtle bg-muted/30 px-4 py-3 dark:border-0 dark:bg-muted-darker">
          <p className="text-sm leading-relaxed text-muted-foreground dark:text-foreground-soft">
            <span aria-hidden>🐿️ </span>
            <span className="text-foreground-muted dark:text-foreground-soft">
              {selectedYear}년 뒤를 기준으로 보면, 예상 수익은 약{' '}
              <span className="font-semibold text-foreground dark:font-bold">
                {formatSignedProfit(currentData.profit)}
              </span>
              까지 이어질 수 있어요.
            </span>
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
            onClick={handleBarClick}
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
            <Tooltip content={<AssetGrowthChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

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

      <AssetGrowthChartSummary
        currentData={currentData}
        selectedBar={selectedBar}
        chartColors={chartColors}
      />
    </div>
  )
}
