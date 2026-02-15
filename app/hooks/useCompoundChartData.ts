'use client'

import { useMemo } from 'react'
import type { Investment } from '@/app/types/investment'

export interface ChartDataPoint {
  month: number
  year: number
  monthLabel: string
  principal: number // 원금 누적
  totalAsset: number // 총 자산 (복리 계산)
  profit: number // 예상 수익
  breakEven?: boolean // 복리 역전 포인트
}

export interface ChartSummary {
  principal: number
  totalAsset: number
  profit: number
}

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
  const summary = useMemo<ChartSummary>(() => {
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

  // 차트 색상
  const chartColors = useMemo(() => {
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
    breakEvenPoint,
    chartColors,
  }
}
