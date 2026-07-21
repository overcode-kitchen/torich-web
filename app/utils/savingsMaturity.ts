import { getStartDate } from '@/app/types/investment'
import type { Investment } from '@/app/types/investment'

export interface SavingsMaturityResult {
  /** 가입~만기 개월 수 (n) */
  months: number
  /** 누적 납입 원금 (매달금액 × n) */
  principal: number
  /** 세전 단리 이자 */
  interest: number
  /** 만기 예상 수령액 (원금 + 이자) */
  total: number
}

/**
 * 가입일~만기일 사이 개월 수를 계산한다 (시작 월 포함, 최소 0).
 */
function monthsBetween(start: Date, maturity: Date): number {
  const diff =
    (maturity.getFullYear() - start.getFullYear()) * 12 +
    (maturity.getMonth() - start.getMonth())
  return Math.max(0, diff)
}

/**
 * 예적금 만기 예상 수령액 (적금 단리·세전 약식).
 * - 원금 = 매달금액 × n
 * - 이자 = 매달금액 × (연이율/100) / 12 × n(n+1)/2
 * - n = 가입~만기 개월 수
 *
 * 세금·복리·우대금리 미반영 약식 추정값이다.
 */
export function calculateSavingsMaturity(
  record: Pick<
    Investment,
    'monthly_amount' | 'interest_rate' | 'maturity_date' | 'start_date' | 'created_at'
  >,
): SavingsMaturityResult | null {
  if (!record.maturity_date || record.interest_rate == null) {
    return null
  }

  const start = getStartDate(record as Investment)
  const maturity = new Date(record.maturity_date)
  if (Number.isNaN(maturity.getTime())) {
    return null
  }

  const months = monthsBetween(start, maturity)
  if (months <= 0) {
    return null
  }

  const monthly = record.monthly_amount
  const rate = record.interest_rate / 100
  const principal = monthly * months
  const interest = Math.round(
    (monthly * rate) / 12 * ((months * (months + 1)) / 2),
  )

  return {
    months,
    principal,
    interest,
    total: principal + interest,
  }
}
