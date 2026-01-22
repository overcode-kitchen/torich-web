/**
 * 투자 기록 데이터 타입
 */
export interface Investment {
  id: string
  title: string
  monthly_amount: number
  period_years: number
  annual_rate: number
  expected_amount: string
  created_at: string
  start_date?: string // 투자 시작일 (없으면 created_at 사용)
  investment_days?: number[] // 매월 투자하는 날짜들 (예: [5, 25] = 매월 5일, 25일)
}

/**
 * 투자 날짜를 포맷팅하는 헬퍼 함수
 * 예: [5, 25] -> "매월 5일, 25일"
 */
export function formatInvestmentDays(days?: number[]): string {
  if (!days || days.length === 0) {
    return '미설정'
  }
  const sortedDays = [...days].sort((a, b) => a - b)
  if (sortedDays.length === 1) {
    return `매월 ${sortedDays[0]}일`
  }
  return `매월 ${sortedDays.join('일, ')}일`
}

/**
 * 투자 아이템 계산 결과 타입
 */
export interface InvestmentCalculation {
  futureValue: number       // 미래 가치 (만기 시점)
  totalPrincipal: number    // 총 원금
  profit: number            // 수익금
  remainingText: string     // 남은 기간 텍스트
  elapsedText: string       // 경과 기간 텍스트
  progress: number          // 진행률 (0-100)
  startDate: Date           // 시작일
  endDate: Date             // 종료일
  isCompleted: boolean      // 완료 여부
}

/**
 * 시작일을 추출하는 헬퍼 함수
 * start_date가 없으면 created_at을 사용
 */
export function getStartDate(investment: Investment): Date {
  if (investment.start_date) {
    return new Date(investment.start_date)
  }
  return new Date(investment.created_at)
}

