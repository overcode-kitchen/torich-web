import { useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { Investment } from '@/app/types/investment'
import {
  getMonthlyCompletionRates,
  getMonthlyCompletionRatesForRange,
} from '@/app/utils/stats'
import type { PaymentHistoryMap } from '@/app/types/payment'
import { PostponedPaymentsMap } from '../payment/usePostponedPayments'

interface UseChartDataProps {
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  /** 소급 납입 — 그 달을 채운 것으로 세야 히트맵·hero와 같은 숫자가 나온다 */
  retroactivePayments: PaymentHistoryMap
  /** 이번 달 미룸 처리된 회차 — 월별 완료율 분모에서 제외 */
  postponedPayments: PostponedPaymentsMap
  isCustomRange: boolean
  effectiveMonths: number
  customDateRange?: DateRange
}

/**
 * 꾸준함 인사이트 — 기간 내 이행 추이를 '집계'로 요약한 통계 고유 지표.
 * 캘린더(일별 체크)·홈(목적 D-day)과 추상화 레벨이 달라 정보가 겹치지 않는다.
 */
export interface ConsistencyInsight {
  /** 기간 내 납입 이벤트가 있던(total>0) 달 수 */
  activeMonths: number
  /** 그중 100% 이행한 달 수 */
  perfectMonths: number
  /** 이행률이 가장 높았던 달 라벨 (동률 시 최근 우선) */
  bestMonthLabel: string
  bestRate: number
  /**
   * 최근부터 연속으로 100% 이행한 달 수.
   * - 이번 달이 진행 중(미완료)이면 제외하고 지난달부터 센다(월초에 0으로 깨지지 않게).
   * - 납입 예정이 없던 달(total=0)은 건너뛴다(쉬어간 달로 끊기지 않게).
   * - 100% 못 채운 과거 달을 만나면 멈춘다.
   */
  currentPerfectStreak: number
}

export interface UseChartDataReturn {
  monthlyRates: { monthLabel: string; rate: number; completed: number; total: number }[]
  periodCompletionRate: number
  chartData: { name: string; rate: number; completed: number; total: number }[]
  /** 과거 달(중립) 막대 색 */
  chartBarColor: string
  /** 현재 달(가장 최근, 차트 마지막 항목) 강조 막대 색 */
  chartEmphasisColor: string
  /** 꾸준함 인사이트 (이행 이벤트가 한 달도 없으면 null) */
  consistency: ConsistencyInsight | null
}

export function useChartData({
  activeRecords,
  completedPayments,
  retroactivePayments,
  postponedPayments,
  isCustomRange,
  effectiveMonths,
  customDateRange
}: UseChartDataProps): UseChartDataReturn {
  const monthlyRates = useMemo(() => {
    if (isCustomRange && customDateRange?.from && customDateRange?.to) {
      return getMonthlyCompletionRatesForRange(activeRecords, completedPayments, customDateRange.from, customDateRange.to, postponedPayments, retroactivePayments)
    }
    return getMonthlyCompletionRates(activeRecords, completedPayments, effectiveMonths, postponedPayments, retroactivePayments)
  }, [activeRecords, completedPayments, retroactivePayments, postponedPayments, effectiveMonths, isCustomRange, customDateRange])

  const periodCompletionRate = useMemo(() => {
    const rates = monthlyRates
    if (rates.length === 0) return 0
    const totalEvents = rates.reduce((s, r) => s + r.total, 0)
    const totalCompleted = rates.reduce((s, r) => s + r.completed, 0)
    return totalEvents > 0 ? Math.round((totalCompleted / totalEvents) * 100) : 0
  }, [monthlyRates])

  const chartData = useMemo(() => {
    return [...monthlyRates].reverse().map((r) => ({
      name: r.monthLabel,
      rate: r.rate,
      completed: r.completed,
      total: r.total,
    }))
  }, [monthlyRates])

  const consistency = useMemo<ConsistencyInsight | null>(() => {
    // monthlyRates[0]이 가장 최근 달 → 동률 best는 strict '>'로 최근 달을 우선 유지
    const active = monthlyRates.filter((r) => r.total > 0)
    if (active.length === 0) return null
    let best = active[0]
    for (const r of active) {
      if (r.rate > best.rate) best = r
    }

    // 연속 100% 이행 스트릭 — monthlyRates[0]이 이번 달. 최근→과거로 센다.
    let currentPerfectStreak = 0
    for (let i = 0; i < monthlyRates.length; i++) {
      const m = monthlyRates[i]
      if (i === 0 && m.total > 0 && m.rate < 100) continue // 이번 달 진행 중 → 제외하고 지난달부터
      if (m.total === 0) continue // 예정 없던 달 → 건너뜀(연속 유지)
      if (m.rate === 100) currentPerfectStreak++
      else break // 100% 못 채운 과거 달 → 중단
    }

    return {
      activeMonths: active.length,
      perfectMonths: active.filter((r) => r.rate === 100).length,
      bestMonthLabel: best.monthLabel,
      bestRate: best.rate,
      currentPerfectStreak,
    }
  }, [monthlyRates])

  const chartBarColor = useMemo(() => {
    if (typeof window === 'undefined') {
      // 서버 사이드 렌더링 시에는 대략적인 coolgray 색상으로 fallback
      return '#9c9ea6'
    }
    const root = getComputedStyle(document.documentElement)
    const fromToken = root.getPropertyValue('--foreground-subtle').trim()
    return fromToken || '#9c9ea6'
  }, [])

  const chartEmphasisColor = useMemo(() => {
    if (typeof window === 'undefined') {
      // SSR fallback — 브랜드 컬러 근사치
      return '#16a34a'
    }
    const root = getComputedStyle(document.documentElement)
    const fromToken = root.getPropertyValue('--primary').trim()
    return fromToken || '#16a34a'
  }, [])

  return {
    monthlyRates,
    periodCompletionRate,
    chartData,
    chartBarColor,
    chartEmphasisColor,
    consistency,
  }
}
