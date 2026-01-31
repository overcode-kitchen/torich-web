'use client'

import { useMemo } from 'react'
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
import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'

interface CompoundChartProps {
  investments: Investment[]
  selectedYear: number
  totalMonthlyPayment: number
}

interface ChartDataPoint {
  month: number
  year: number
  monthLabel: string
  principal: number // 원금 누적
  totalAsset: number // 총 자산 (복리 계산)
  profit: number // 예상 수익
  breakEven?: boolean // 복리 역전 포인트
}

export default function CompoundChart({
  investments,
  selectedYear,
  totalMonthlyPayment,
}: CompoundChartProps) {
  // 차트 데이터 생성
  const chartData = useMemo(() => {
    if (investments.length === 0 || totalMonthlyPayment === 0) {
      return []
    }

    const months = selectedYear * 12
    const data: ChartDataPoint[] = []
    let breakEvenFound = false

    // 각 투자별로 월별 누적 자산을 추적
    const investmentBalances = investments.map((investment) => {
      const R = investment.annual_rate ? investment.annual_rate / 100 : 0.10
      const monthlyRate = R / 12
      const P = investment.period_years * 12 // 만기 (개월)
      
      return {
        investment,
        monthlyAmount: investment.monthly_amount,
        monthlyRate,
        maturityMonths: P,
        balance: 0, // 현재 시점의 자산
      }
    })

    for (let month = 1; month <= months; month++) {
      // 원금 누적: 각 투자별로 만기 전까지만 납입
      let principal = 0
      investments.forEach((investment) => {
        const P = investment.period_years * 12 // 만기 (개월)
        if (month <= P) {
          // 만기 전: 납입액 누적
          principal += investment.monthly_amount * month
        } else {
          // 만기 후: 만기 시점의 원금만 (더 이상 납입 없음)
          principal += investment.monthly_amount * P
        }
      })

      // 총 자산 계산: 각 투자별로 매월 복리 계산
      let totalAsset = 0
      
      investmentBalances.forEach((item) => {
        // 만기 전이면 복리 계산
        if (month <= item.maturityMonths) {
          // 이전 달 자산에 이자 추가 + 이번 달 납입액 추가
          item.balance = item.balance * (1 + item.monthlyRate) + item.monthlyAmount
        } else {
          // 만기 후에는 이자 없이 유지 (현금 보관)
          // 만기 시점의 자산을 그대로 유지 (이미 계산되어 있음)
          // balance는 이미 만기 시점에 계산되어 있으므로 그대로 유지
        }
        
        totalAsset += item.balance
      })

      const profit = totalAsset - principal

      // 복리 역전 포인트 찾기 (총 자산이 원금을 처음 추월하는 시점)
      const isBreakEven =
        !breakEvenFound && totalAsset > principal && month > 1

      if (isBreakEven) {
        breakEvenFound = true
      }

      // 라벨 생성 (1년, 2년, ... 또는 1개월, 6개월, 12개월 등)
      let monthLabel = ''
      if (month % 12 === 0) {
        monthLabel = `${month / 12}년`
      } else if (month === 1 || month === 6 || month % 12 === 6) {
        monthLabel = `${month}개월`
      }

      data.push({
        month,
        year: Math.floor(month / 12),
        monthLabel,
        principal,
        totalAsset,
        profit,
        breakEven: isBreakEven,
      })
    }

    return data
  }, [investments, selectedYear, totalMonthlyPayment])

  // 하단 요약 정보
  const summary = useMemo(() => {
    if (chartData.length === 0) {
      return { principal: 0, totalAsset: 0, profit: 0 }
    }

    const last = chartData[chartData.length - 1]
    return {
      principal: last.principal,
      totalAsset: last.totalAsset,
      profit: last.profit,
    }
  }, [chartData])

  // 복리 역전 포인트 찾기
  const breakEvenPoint = useMemo(() => {
    return chartData.find((d) => d.breakEven)
  }, [chartData])

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint
      const yearText = data.year > 0 ? `${data.year}년 ` : ''
      const monthText = data.month % 12 === 0 ? '' : `${data.month % 12}개월`
      const timeLabel = `${yearText}${monthText}`.trim() || `${data.month}개월`
      
      return (
        <div className="bg-white border border-coolgray-200 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-coolgray-500 mb-2">{timeLabel}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-coolgray-600">원금</span>
              <span className="text-xs font-semibold text-coolgray-900">
                {formatCurrency(data.principal)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-coolgray-600">예상 수익</span>
              <span className="text-xs font-semibold text-brand-600">
                +{formatCurrency(data.profit)}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-coolgray-100 pt-1 mt-1">
              <span className="text-xs font-medium text-coolgray-700">총 자산</span>
              <span className="text-xs font-bold text-coolgray-900">
                {formatCurrency(data.totalAsset)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // 빈 상태
  if (investments.length === 0 || totalMonthlyPayment === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-coolgray-400">
        <p className="text-sm">투자를 추가하면 차트가 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 차트 영역 */}
      <div className="h-[200px] -ml-4 -mr-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E7E8" horizontal={true} vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(value) => {
                const dataPoint = chartData.find((d) => d.month === value)
                return dataPoint?.monthLabel || ''
              }}
              stroke="#9C9EA6"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => {
                if (value >= 10000) {
                  return `${Math.floor(value / 10000)}만`
                }
                return `${value}`
              }}
              stroke="#9C9EA6"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
              formatter={(value) => <span className="text-xs text-coolgray-700">{value}</span>}
            />
            
            {/* 원금 라인 (회색 점선) */}
            <Line
              type="monotone"
              dataKey="principal"
              stroke="#9C9EA6"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="원금"
            />
            
            {/* 총 자산 라인 (브랜드 그린 실선) */}
            <Line
              type="monotone"
              dataKey="totalAsset"
              stroke="#02c463"
              strokeWidth={2}
              dot={false}
              name="총 자산"
            />

            {/* 예상 수익 라인 (브랜드 그린, 더 진한 색, 두꺼운 선) - 복리 효과 강조 */}
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#02b25a"
              strokeWidth={2.5}
              dot={false}
              name="예상 수익"
            />

            {/* 복리 역전 포인트 마커 */}
            {breakEvenPoint && (
              <ReferenceLine
                x={breakEvenPoint.month}
                stroke="#02c463"
                strokeDasharray="2 2"
                strokeWidth={1.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 하단 요약 정보 */}
      <div className="flex items-center justify-between pt-2 border-t border-coolgray-100">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-coolgray-500 mb-0.5">원금</p>
            <p className="text-sm font-semibold text-coolgray-900">
              {formatCurrency(summary.principal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-coolgray-500 mb-0.5">예상 수익</p>
            <p className="text-sm font-semibold text-brand-600">
              +{formatCurrency(summary.profit)}
            </p>
          </div>
        </div>
        {breakEvenPoint && (
          <div className="text-right">
            <p className="text-xs text-coolgray-500 mb-0.5">복리 역전</p>
            <p className="text-xs font-semibold text-brand-600">
              ⚡ {breakEvenPoint.month}개월
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
