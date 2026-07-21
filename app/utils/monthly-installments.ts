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
  const lastDay = new Date(year, month, 0).getDate()
  const clamped = raw.map((d) => Math.min(d, lastDay))
  return Array.from(new Set(clamped)).sort((a, b) => a - b)
}
