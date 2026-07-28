import type { Investment } from '@/app/types/investment'
import type { Goal } from '@/app/types/goal'
import type { CapturedAmountsMap, PaymentHistoryMap } from '@/app/types/payment'

/** 안전 상한 — 첫 납입이 아무리 오래됐어도 이만큼만 그린다 (잘려나간 과거는 출발선에 합산) */
const MAX_MONTHS = 120

export interface CumulativePoint {
  yearMonth: string
  /** 축 라벨 — 'YY.M' */
  label: string
  /** 그 달까지 쌓인 누적 원금(원) */
  cumulative: number
}

export interface CumulativePrincipal {
  /** 오래된 달 → 이번 달. 2개 미만이면 곡선을 그리지 않는다 */
  points: CumulativePoint[]
  /** 지금까지 체크한 납입 횟수 (자동 + 소급) */
  paymentCount: number
  /** 첫 납입이 있던 달부터 이번 달까지 개월 수 */
  monthSpan: number
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * 월별 누적 원금 곡선 데이터.
 *
 * 마지막 점은 `useStatsCalculations`의 `totalPaidPrincipal`(= 실현 납입 원금 + 목적의 '이미 모은 돈')과
 * 정확히 같아야 한다 — 같은 카드의 큰 숫자와 곡선 끝이 어긋나면 둘 다 못 믿게 된다. 그래서 납입액을
 * 여기서도 매수 시점 캡처 금액으로 합산하고(없으면 현재 monthly_amount 폴백), 상한에 잘린 과거 달과
 * 날짜가 없는 '이미 모은 돈'은 버리지 않고 출발선에 얹는다.
 *
 * '이미 모은 돈'(goal.external_amount)을 출발선에 두는 이유: 토리치를 쓰기 전에 쌓인 금액이라
 * 어느 달에 넣었는지 알 수 없고, 시간축 어딘가에 계단으로 꽂으면 그 달에 그만큼 적립한 것처럼 읽힌다.
 */
export function buildCumulativePrincipal(
  records: Investment[],
  goals: Goal[],
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  capturedAmounts: CapturedAmountsMap,
  today: Date = new Date()
): CumulativePrincipal {
  const byMonth = new Map<string, number>()
  let paymentCount = 0
  let earliest: string | null = null

  for (const record of records) {
    const fallback = record.monthly_amount > 0 ? record.monthly_amount : 0
    const captured = capturedAmounts.get(record.id)
    for (const map of [completedPayments, retroactivePayments]) {
      const dates = map.get(record.id)
      if (!dates) continue
      for (const date of dates) {
        const capturedWon = captured?.get(date)
        const won = capturedWon != null && capturedWon > 0 ? capturedWon : fallback
        const yearMonth = date.slice(0, 7)
        byMonth.set(yearMonth, (byMonth.get(yearMonth) ?? 0) + won)
        paymentCount += 1
        if (earliest === null || date < earliest) earliest = date
      }
    }
  }

  const baseline = goals.reduce((sum, g) => sum + (g.external_amount ?? 0), 0)

  // 납입이 한 건도 없으면 시간축이 없다 → 곡선 없이 큰 숫자만 보여준다
  if (earliest === null) return { points: [], paymentCount: 0, monthSpan: 0 }

  // 'YYYY-MM-DD' 문자열에서 바로 연·월을 읽는다 (로컬 타임존 파싱으로 달이 밀리지 않게)
  const startYear = Number(earliest.slice(0, 4))
  const startMonth = Number(earliest.slice(5, 7))
  const elapsed = (today.getFullYear() - startYear) * 12 + (today.getMonth() + 1 - startMonth) + 1
  const monthSpan = Math.min(Math.max(elapsed, 1), MAX_MONTHS)

  const timeline = Array.from({ length: monthSpan }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (monthSpan - 1 - i), 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    return { yearMonth: monthKey(year, month), label: `${String(year).slice(2)}.${month}` }
  })

  const windowStart = timeline[0].yearMonth
  let running = baseline
  for (const [yearMonth, won] of byMonth) {
    if (yearMonth < windowStart) running += won
  }

  const points = timeline.map(({ yearMonth, label }) => {
    running += byMonth.get(yearMonth) ?? 0
    return { yearMonth, label, cumulative: running }
  })

  return { points, paymentCount, monthSpan }
}
