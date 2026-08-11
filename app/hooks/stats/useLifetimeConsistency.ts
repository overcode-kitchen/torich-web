import { useMemo } from 'react'
import type { Investment } from '@/app/types/investment'
import type { PaymentHistoryMap } from '@/app/types/payment'
import type { PostponedPaymentsMap } from '@/app/hooks/payment/usePostponedPayments'
import { getMonthlyCompletionRates } from '@/app/utils/stats'

/** 안전 상한 — 가장 이른 기록이 아무리 오래돼도 이만큼만 거슬러 센다 */
const MAX_MONTHS = 120

interface UseLifetimeConsistencyProps {
  activeRecords: Investment[]
  completedPayments: PaymentHistoryMap
  retroactivePayments: PaymentHistoryMap
  postponedPayments: PostponedPaymentsMap
}

export interface LifetimeConsistency {
  /** 지금까지 연속으로 100% 이행한 개월 수 */
  streakMonths: number
  /** 전체 기간 중 가장 길었던 연속 개월 수 */
  bestStreakMonths: number
  /** 지금까지 체크한 적립 횟수 (자동 + 소급) */
  totalPayments: number
  /** 납입 기록이 한 건이라도 있는지 */
  hasHistory: boolean
}

/**
 * 기간 필터와 무관한 '전체 기간' 꾸준함 집계.
 *
 * useChartData의 consistency는 선택된 기간 안에서만 돈다. 필터가 `최근 3개월`이면 스트릭이
 * 최대 3으로 잘리고, 필터를 바꿀 때마다 "연속 N개월"이 달라져 사실을 주장할 수 없었다.
 * 기록 탭 hero는 필터에 흔들리면 안 되므로 집계를 여기서 따로 뽑는다.
 *
 * 스트릭 판정 규칙은 기존(useChartData)과 동일하게 유지한다.
 * - 시작점은 가장 이른 납입 기록이 있는 달
 * - 예정이 없던 달(total=0)은 스트릭을 끊지 않는다
 * - 이번 달은 아직 진행 중이라 판정에서 제외한다
 */
export function useLifetimeConsistency({
  activeRecords,
  completedPayments,
  retroactivePayments,
  postponedPayments,
}: UseLifetimeConsistencyProps): LifetimeConsistency {
  return useMemo(() => {
    let earliest: string | null = null
    let totalPayments = 0

    for (const map of [completedPayments, retroactivePayments]) {
      for (const dates of map.values()) {
        totalPayments += dates.size
        for (const d of dates) {
          if (earliest === null || d < earliest) earliest = d
        }
      }
    }

    if (earliest === null) {
      return { streakMonths: 0, bestStreakMonths: 0, totalPayments: 0, hasHistory: false }
    }

    // 'YYYY-MM-DD' 문자열에서 바로 연·월을 읽는다 (로컬 타임존 파싱으로 달이 밀리지 않게)
    const startYear = Number(earliest.slice(0, 4))
    const startMonth = Number(earliest.slice(5, 7))
    const today = new Date()
    const elapsed =
      (today.getFullYear() - startYear) * 12 + (today.getMonth() + 1 - startMonth) + 1
    const monthsBack = Math.min(Math.max(elapsed, 1), MAX_MONTHS)

    // 최근 → 과거 순으로 돌아온다
    const rates = getMonthlyCompletionRates(
      activeRecords,
      completedPayments,
      monthsBack,
      postponedPayments,
      retroactivePayments,
      today
    )

    let streakMonths = 0
    let bestStreakMonths = 0
    let run = 0
    let streakClosed = false

    for (let i = 0; i < rates.length; i++) {
      const m = rates[i]
      // 이번 달은 아직 진행 중 → 판정에서 빼고 지난달부터 센다(월초에 0으로 깨지지 않게)
      if (i === 0 && m.total > 0 && m.rate < 100) continue
      if (m.total === 0) continue // 예정 없던 달 → 건너뜀(연속 유지)
      if (m.rate === 100) {
        run++
        if (run > bestStreakMonths) bestStreakMonths = run
        if (!streakClosed) streakMonths = run
      } else {
        run = 0
        streakClosed = true // 현재 진행 중인 스트릭은 여기서 끝
      }
    }

    return { streakMonths, bestStreakMonths, totalPayments, hasHistory: true }
  }, [activeRecords, completedPayments, retroactivePayments, postponedPayments])
}
