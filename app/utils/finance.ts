/**
 * 금융 계산 유틸리티 함수
 */

/**
 * 비중 계산 (퍼센트)
 * @param amount 대상 금액
 * @param total 총 금액
 * @returns 소수점 반올림된 퍼센트 (0~100)
 */
export function calculatePercentage(amount: number, total: number): number {
  if (total === 0) return 0
  return Math.round((amount / total) * 100)
}
