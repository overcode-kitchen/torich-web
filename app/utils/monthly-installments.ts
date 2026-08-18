/**
 * 다중 회차(investment_days) 납입일 계산 공용 유틸.
 * 홈 목적 카드 완료 토글(useMonthlyPaymentStatus)과 상세 납입 기록 표(PaymentHistoryTable)가
 * "같은 날짜 = 같은 회차"로 판정하도록 계산 규칙을 한 곳으로 모은다.
 */

/** YYYY-MM-DD */
export function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * 이번 달 납입 회차 날짜들(1~말일로 클램프·중복 제거·오름차순).
 * - 31일 등 그 달에 없는 날은 말일로 당긴다(그대로 두면 "2026-06-31"이 만들어져 Postgres가 22008로 거부).
 * - investment_days가 없으면 매월 1일 1회차로 본다.
 */
export function monthlyInstallmentDays(
  investmentDays: number[] | null | undefined,
  year: number,
  month: number,
): number[] {
  const raw = investmentDays && investmentDays.length > 0 ? investmentDays : [1]
  const clamped = raw.map((d) => clampDayToMonth(d, year, month))
  return Array.from(new Set(clamped)).sort((a, b) => a - b)
}

/**
 * 그 달에 없는 날을 말일로 당긴다 (6월 31일 → 30일). month는 1~12.
 *
 * "이번 달 회차가 며칠인가"에 화면마다 다르게 답하던 것을 이 함수 하나로 모은다.
 * 당김으로 통일하는 이유: 홈 토글과 상세 기록표가 이미 당김이고, 건너뜀으로
 * 맞추면 홈에서 6월에 체크할 회차가 사라져 오히려 혼란스럽다.
 */
export function clampDayToMonth(day: number, year: number, month: number): number {
  return Math.min(day, new Date(year, month, 0).getDate())
}

/**
 * 이번 달 실제 납입 회차 날짜들 — 클램프·중복 제거 후 시작일·종료일로 거른다.
 *
 * investment_days가 비었을 때의 처리(월 1회로 볼지, 회차 없음으로 볼지)는
 * 호출부마다 정책이 달라 여기서 정하지 않는다. 호출부가 days를 정해서 넘긴다.
 */
export function installmentDaysInRange(
  days: number[],
  year: number,
  month: number,
  startDate: Date | null,
  endDate: Date | null,
): number[] {
  const clamped = Array.from(
    new Set(days.map((d) => clampDayToMonth(d, year, month)))
  ).sort((a, b) => a - b)

  return clamped.filter((day) => {
    const paymentDate = new Date(year, month - 1, day)
    if (startDate && paymentDate < startDate) return false
    if (endDate && paymentDate > endDate) return false
    return true
  })
}

/** 이 날짜가 해당 기록의 납입일인가 (말일 당김 기준) */
export function isInstallmentDay(days: number[], date: Date): boolean {
  const clampedDay = date.getDate()
  return days.some(
    (d) => clampDayToMonth(d, date.getFullYear(), date.getMonth() + 1) === clampedDay
  )
}
