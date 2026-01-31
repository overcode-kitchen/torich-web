'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { generatePortfolioGrowthData, findGoldenCrossPoint, type ChartDataPoint } from '@/app/utils/finance'
import type { Investment } from '@/app/types/investment'

interface AssetGrowthChartProps {
  investments: Investment[]
  selectedYear: number
}

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint
    const principal = data.principal
    const profit = data.profit
    const total = data.total
    const profitRatio = total > 0 ? ((profit / total) * 100).toFixed(1) : '0.0'

    // 시점 라벨 생성
    const years = Math.floor(data.month / 12)
    const months = data.month % 12
    let timeLabel = ''
    if (years > 0 && months > 0) {
      timeLabel = `${years}년 ${months}개월`
    } else if (years > 0) {
      timeLabel = `${years}년`
    } else {
      timeLabel = `${data.month}개월`
    }

    return (
      <div className="bg-white border border-coolgray-200 rounded-xl p-3 shadow-lg min-w-[160px]">
        <p className="text-xs text-coolgray-500 mb-2 font-medium">{timeLabel}</p>
        <div className="space-y-1.5">
          {/* 수익금 (가장 위, 강조) */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-brand-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              수익금
            </span>
            <span className="text-sm font-bold text-brand-600">
              +{formatCurrency(profit)}
            </span>
          </div>
          {/* 수익 비중 */}
          <div className="flex justify-end">
            <span className="text-xs text-coolgray-400">({profitRatio}%)</span>
          </div>
          {/* 원금 */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-coolgray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-coolgray-300"></span>
              원금
            </span>
            <span className="text-xs font-semibold text-coolgray-700">
              {formatCurrency(principal)}
            </span>
          </div>
          {/* 구분선 */}
          <div className="border-t border-coolgray-100 pt-1.5 mt-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-coolgray-700">💰 총 자산</span>
              <span className="text-sm font-bold text-coolgray-900">
                {formatCurrency(total)}
              </span>
            </div>
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
  // 차트 데이터 생성
  const chartData = useMemo(() => {
    if (investments.length === 0) {
      return []
    }

    const portfolioData = investments.map((inv) => ({
      monthly_amount: inv.monthly_amount,
      annual_rate: inv.annual_rate || 10,
      period_years: inv.period_years,
    }))

    return generatePortfolioGrowthData(portfolioData, selectedYear)
  }, [investments, selectedYear])

  // 복리 역전 포인트 찾기
  const goldenCrossIndex = useMemo(() => {
    return findGoldenCrossPoint(chartData)
  }, [chartData])

  // 현재 시점(마지막) 데이터
  const currentData = chartData.length > 0 ? chartData[chartData.length - 1] : null

  // 빈 상태
  if (investments.length === 0 || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-coolgray-400">
        <p className="text-sm">투자를 추가하면 차트가 표시됩니다</p>
      </div>
    )
  }

  // X축 라벨 포맷터
  const formatXAxisLabel = (value: number) => {
    const dataPoint = chartData[value - 1]
    if (!dataPoint) return ''
    
    if (dataPoint.month % 12 === 0) {
      return `${dataPoint.month / 12}년`
    }
    if (dataPoint.month === 1 || dataPoint.month === 6) {
      return `${dataPoint.month}개월`
    }
    return ''
  }

  return (
    <div className="space-y-4">
      {/* 토리 메시지 - 격차 칭찬 */}
      {currentData && currentData.profit > 0 && (
        <div className="bg-brand-50 rounded-xl px-4 py-3">
          <p className="text-sm text-coolgray-700">
            🐿️ <span className="font-medium">토리:</span> "사장님! 숨만 쉬었는데{' '}
            <span className="font-bold text-brand-600">{formatCurrency(currentData.profit)}</span>
            이 더 생겼어요! 💚"
          </p>
        </div>
      )}

      {/* 차트 영역 */}
      <div className="h-[220px] -ml-4 -mr-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <defs>
              {/* 수익금 그라데이션 - 위로 갈수록 영롱하게 */}
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.9} />
                <stop offset="50%" stopColor="#22C55E" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0.2} />
              </linearGradient>
              {/* 원금 그라데이션 */}
              <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E5E7EB" stopOpacity={1} />
                <stop offset="100%" stopColor="#F3F4F6" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E7E8" horizontal={true} vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatXAxisLabel}
              stroke="#9C9EA6"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => {
                if (value >= 100000000) {
                  return `${(value / 100000000).toFixed(1)}억`
                }
                if (value >= 10000) {
                  return `${Math.floor(value / 10000)}만`
                }
                return `${value}`
              }}
              stroke="#9C9EA6"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={['dataMin', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 원금 영역 (하단, 옅은 회색 - 단단한 지지대) */}
            <Area
              type="monotone"
              dataKey="principal"
              stackId="1"
              stroke="#D1D5DB"
              strokeWidth={1}
              fill="url(#principalGradient)"
              name="원금"
            />

            {/* 수익금 영역 (상단, 브랜드 그린 그라데이션 - The Gap) */}
            <Area
              type="monotone"
              dataKey="profit"
              stackId="1"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#profitGradient)"
              name="수익금"
            />

            {/* 복리 역전 포인트 (Golden Cross) 강조 */}
            {goldenCrossIndex !== null && (
              <ReferenceLine
                x={chartData[goldenCrossIndex].month}
                stroke="#16A34A"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: '🚩 수익 > 원금',
                  position: 'insideTopRight',
                  fill: '#16A34A',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-coolgray-200 border border-coolgray-300"></span>
          <span className="text-coolgray-600">원금</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-brand-500"></span>
          <span className="text-coolgray-600">수익금 (The Gap)</span>
        </div>
      </div>

      {/* 하단 요약 정보 */}
      {currentData && (
        <div className="flex items-center justify-between pt-3 border-t border-coolgray-100">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-xs text-coolgray-500 mb-0.5">원금</p>
              <p className="text-base font-semibold text-coolgray-900">
                {formatCurrency(currentData.principal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-coolgray-500 mb-0.5">수익금</p>
              <p className="text-base font-bold text-brand-600">
                +{formatCurrency(currentData.profit)}
              </p>
            </div>
          </div>
          {goldenCrossIndex !== null && (
            <div className="text-right">
              <p className="text-xs text-coolgray-500 mb-0.5">복리 역전</p>
              <p className="text-sm font-semibold text-brand-600">
                🚩 {Math.floor(chartData[goldenCrossIndex].month / 12)}년 {chartData[goldenCrossIndex].month % 12}개월
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
