/**
 * 금융 계산 유틸리티 함수
 */

export interface ChartDataPoint {
  month: number
  principal: number // 순수하게 내가 납입한 누적 원금
  profit: number // 순수 수익금 (총 자산 - 누적 원금)
  total: number // 총 자산
}

/**
 * 월별 자산 성장 데이터 생성
 * @param monthlyAmount 월 적립액
 * @param annualRate 연 수익률 (예: 10 = 10%)
 * @param periodYears 기간 (년)
 * @returns 월별 데이터 포인트 배열
 */
export function generateAssetGrowthData(
  monthlyAmount: number,
  annualRate: number,
  periodYears: number
): ChartDataPoint[] {
  const monthlyRate = annualRate / 100 / 12 // 월 이율
  const totalMonths = periodYears * 12
  const data: ChartDataPoint[] = []

  let balance = 0 // 현재 시점의 총 자산

  for (let month = 1; month <= totalMonths; month++) {
    // 이전 달 자산에 이자 추가 + 이번 달 납입액 추가
    balance = balance * (1 + monthlyRate) + monthlyAmount

    // 총 누적 원금
    const principal = monthlyAmount * month

    // 총 누적 수익
    const profit = balance - principal

    // 총 자산
    const total = balance

    data.push({
      month,
      principal,
      profit,
      total,
    })
  }

  return data
}

/**
 * 복리 역전 포인트(Golden Cross) 찾기
 * @param data 차트 데이터 배열
 * @returns 역전 포인트의 인덱스 (없으면 null)
 */
export function findGoldenCrossPoint(data: ChartDataPoint[]): number | null {
  for (let i = 0; i < data.length; i++) {
    if (data[i].profit >= data[i].principal) {
      return i
    }
  }
  return null
}

/**
 * 여러 투자의 월별 자산 성장 데이터 생성 (포트폴리오 합계)
 * @param investments 투자 배열 (월 납입액, 연 수익률, 만기 기간)
 * @param selectedYear 선택된 기간 (년)
 * @returns 월별 데이터 포인트 배열
 */
export function generatePortfolioGrowthData(
  investments: Array<{
    monthly_amount: number
    annual_rate: number
    /** 적립형(목표 기간 없음)은 null — 전체 기간 동안 계속 납입 */
    period_years: number | null
  }>,
  selectedYear: number
): ChartDataPoint[] {
  const totalMonths = selectedYear * 12
  const data: ChartDataPoint[] = []

  // 각 투자별로 월별 자산 추적
  const investmentBalances = investments.map((investment) => {
    const R = investment.annual_rate / 100
    const monthlyRate = R / 12
    // 적립형은 만기가 없으므로 전체 시뮬레이션 기간(selectedYear)만큼 납입
    const maturityMonths =
      investment.period_years && investment.period_years > 0
        ? investment.period_years * 12
        : totalMonths

    return {
      monthlyAmount: investment.monthly_amount,
      monthlyRate,
      maturityMonths,
      balance: 0, // 현재 시점의 자산
      principalPaid: 0, // 현재까지 납입한 원금
    }
  })

  for (let month = 1; month <= totalMonths; month++) {
    let principal = 0
    let total = 0

    investmentBalances.forEach((item) => {
      if (month <= item.maturityMonths) {
        // 만기 전: 복리 계산 + 원금 누적
        item.balance = item.balance * (1 + item.monthlyRate) + item.monthlyAmount
        item.principalPaid += item.monthlyAmount
      } else {
        // 만기 후: 이자 없이 유지 (현금 보관)
        // balance와 principalPaid는 그대로 유지
      }

      principal += item.principalPaid
      total += item.balance
    })

    const profit = total - principal

    data.push({
      month,
      principal,
      profit,
      total,
    })
  }

  return data
}

/** 마일스톤 연도 목록 (1년, 3년, 5년, 10년, 최종) */
export function getMilestoneYears(selectedYear: number): number[] {
  const candidates = [1, 3, 5, 10, selectedYear]
  return [...new Set(candidates)].filter((y) => y <= selectedYear).sort((a, b) => a - b)
}

/** 전체 데이터에서 마일스톤 시점만 추출 */
export function getMilestoneChartData(
  fullData: ChartDataPoint[],
  selectedYear: number
): ChartDataPoint[] {
  const years = getMilestoneYears(selectedYear)
  const targetMonths = new Set(years.map((y) => y * 12))
  return fullData.filter((d) => targetMonths.has(d.month))
}

/**
 * 시뮬레이션 기반 복리 계산 헬퍼 함수
 *
 * - T: 사용자가 선택한 연도
 * - P: 투자 만기(년)
 * - R: 연이율(예: 0.10 = 10%)
 *
 * 기납입액 기준 월복리 공식(월초 납입):
 * PMT * ((1+r)^n - 1) / r * (1+r)
 */
export function calculateSimulatedValue(
  monthlyAmount: number,
  T: number,
  P: number | null,
  R: number = 0.1
): number {
  const monthlyRate: number = R / 12

  // 적립형(P null 또는 <= 0): 만기 없음 — T년 전체 기간 납입
  const effectiveP = P && P > 0 ? P : T

  // Case A: 선택 시점이 만기보다 짧거나 같음 (T <= P)
  if (T <= effectiveP) {
    const totalMonths: number = T * 12
    if (monthlyRate === 0) return monthlyAmount * totalMonths
    const futureValue: number =
      monthlyAmount *
      ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
      (1 + monthlyRate)
    return futureValue
  }

  // Case B: 선택 시점이 만기보다 김 (T > P) — 만기 이후는 이자 없이 현금 보관
  const maturityMonths: number = effectiveP * 12
  if (monthlyRate === 0) return monthlyAmount * maturityMonths
  const maturityValue: number =
    monthlyAmount *
    ((Math.pow(1 + monthlyRate, maturityMonths) - 1) / monthlyRate) *
    (1 + monthlyRate)

  return maturityValue
}

// 복리 계산 함수 (동적 수익률 적용)
export function calculateFinalAmount(
  monthlyAmount: number,
  periodYears: number,
  rate: number
): number {
  const monthlyRate = rate / 12 / 100
  const totalMonths = periodYears * 12
  const finalAmount = monthlyAmount *
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
    (1 + monthlyRate)
  return Math.round(finalAmount)
}

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
