/**
 * 투자 정보 데이터 포맷팅 및 변환 유틸리티
 */

import type { InvestmentUnitType } from '@/app/types/investment'

interface FormatInvestmentDataParams {
  stockName: string
  monthlyAmount: string // 콤마가 포함된 문자열 (만원 단위)
  period: string
  /** 적립형(목표 기간 없음) 여부 */
  isHabitMode?: boolean
  startDate: Date
  investmentDays: number[]
  annualRate: number
  isManualInput: boolean
  originalSystemRate: number | null
  selectedStock: any
  market?: 'KR' | 'US'
  /** 매수 단위 모드 (디폴트 'amount') */
  unitType?: InvestmentUnitType
  /** 주수 모드일 때 월 매수 주수 (정수 문자열) */
  monthlyShares?: string
  /** 주수 모드 환산용 1주 시세 (selectedStock.currentPrice) */
  sharePrice?: number
}

interface FormattedInvestmentData {
  title: string
  symbol: string | null
  monthly_amount: number // 원 단위 (shares 모드는 monthlyShares × sharePrice 환산값)
  period_years: number | null
  annual_rate: number
  final_amount: number
  start_date: string // YYYY-MM-DD 형식
  investment_days: number[] | null
  is_custom_rate: boolean
  market: 'KR' | 'US' | null
  unit_type: InvestmentUnitType
  monthly_shares: number | null
}

/**
 * 월 납입액을 만원 단위에서 원 단위로 변환
 */
export function convertMonthlyAmountToWon(monthlyAmount: string): number {
  return parseInt(monthlyAmount.replace(/,/g, '')) * 10000
}

/**
 * 기간 문자열을 숫자로 변환
 */
export function convertPeriodToYears(period: string): number {
  return parseInt(period)
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * is_custom_rate 판별: 직접 입력했거나, 시스템 값을 수정한 경우 true
 */
export function determineIsCustomRate(
  isManualInput: boolean,
  originalSystemRate: number | null,
  annualRate: number
): boolean {
  return isManualInput || (originalSystemRate !== null && annualRate !== originalSystemRate)
}

/**
 * symbol 결정: 검색을 통해 선택한 경우 selectedStock.symbol, 직접 입력은 null
 */
export function determineStockSymbol(
  isManualInput: boolean,
  selectedStock: any
): string | null {
  return !isManualInput && selectedStock?.symbol ? selectedStock.symbol : null
}

/**
 * 투자 정보 데이터를 DB 저장 형식으로 변환
 */
export async function formatInvestmentData(
  params: FormatInvestmentDataParams
): Promise<FormattedInvestmentData> {
  const unitType: InvestmentUnitType = params.unitType ?? 'amount'

  // shares 모드는 monthlyShares × sharePrice 로 monthly_amount 환산해 NOT NULL 제약 충족
  let monthlyAmountInWon: number
  let monthlySharesNum: number | null = null
  if (unitType === 'shares') {
    const shares = parseInt(params.monthlyShares ?? '', 10)
    monthlySharesNum = Number.isFinite(shares) && shares > 0 ? shares : null
    const price = params.sharePrice && params.sharePrice > 0 ? params.sharePrice : 0
    monthlyAmountInWon = monthlySharesNum ? Math.round(monthlySharesNum * price) : 0
  } else {
    monthlyAmountInWon = convertMonthlyAmountToWon(params.monthlyAmount)
  }

  const periodYearsNum = params.isHabitMode ? null : convertPeriodToYears(params.period)

  // 최종 금액 계산 (적립형은 만기 금액 개념이 없으므로 0)
  const { calculateFinalAmount } = await import('@/app/utils/finance')
  const finalAmount = periodYearsNum
    ? calculateFinalAmount(monthlyAmountInWon, periodYearsNum, params.annualRate)
    : 0

  const isCustomRate = determineIsCustomRate(
    params.isManualInput,
    params.originalSystemRate,
    params.annualRate
  )

  const stockSymbol = determineStockSymbol(params.isManualInput, params.selectedStock)

  return {
    title: params.stockName.trim(),
    symbol: stockSymbol,
    monthly_amount: monthlyAmountInWon,
    period_years: periodYearsNum,
    annual_rate: params.annualRate,
    final_amount: finalAmount,
    start_date: formatDateToISO(params.startDate),
    investment_days: params.investmentDays.length > 0 ? params.investmentDays : null,
    is_custom_rate: isCustomRate,
    market: params.market ?? null,
    unit_type: unitType,
    monthly_shares: monthlySharesNum,
  }
}
