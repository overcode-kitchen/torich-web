'use client'

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend,
} from 'recharts'
import CompoundChartTooltip from './CompoundChartTooltip'
import {
    formatYAxisTick,
    formatXAxisTick,
    legendFormatter,
    chartMargins,
} from './CompoundChartConfig'
import type { ChartColors, ChartDataPoint } from '@/app/hooks/useCompoundChartData'

interface CompoundChartGraphProps {
    chartData: any[]
    chartColors: ChartColors
    breakEvenPoint: ChartDataPoint | null
}

export default function CompoundChartGraph({ chartData, chartColors, breakEvenPoint }: CompoundChartGraphProps) {
    return (
        <div className="h-[200px] -ml-4 -mr-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={chartMargins}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={true} vertical={false} />
                    <XAxis
                        dataKey="month"
                        tickFormatter={(value) => formatXAxisTick(value, chartData)}
                        stroke={chartColors.axis}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tickFormatter={formatYAxisTick}
                        stroke={chartColors.axis}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CompoundChartTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconType="line"
                        formatter={legendFormatter}
                    />

                    {/* 원금 라인 (회색 점선) */}
                    <Line
                        type="monotone"
                        dataKey="principal"
                        stroke={chartColors.principal}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                        name="원금"
                    />

                    {/* 총 자산 라인 (브랜드 그린 실선) */}
                    <Line
                        type="monotone"
                        dataKey="totalAsset"
                        stroke={chartColors.totalAsset}
                        strokeWidth={2}
                        dot={false}
                        name="총 자산"
                    />

                    {/* 예상 수익 라인 (브랜드 그린, 더 진한 색, 두꺼운 선) - 복리 효과 강조 */}
                    <Line
                        type="monotone"
                        dataKey="profit"
                        stroke={chartColors.profit}
                        strokeWidth={2.5}
                        dot={false}
                        name="예상 수익"
                    />

                    {/* 복리 역전 포인트 마커 */}
                    {breakEvenPoint && (
                        <ReferenceLine
                            x={breakEvenPoint.month}
                            stroke={chartColors.breakEven}
                            strokeDasharray="2 2"
                            strokeWidth={1.5}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
