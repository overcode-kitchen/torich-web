/**
 * 매수 단위 모드.
 * - 'amount' (기본): 월 N원씩 적립
 * - 'shares': 월 N주씩 적립 (1단계는 한국 주식 한정)
 */
export type InvestmentUnitType = 'amount' | 'shares'

/**
 * 투자 기록 데이터 타입
 */
export interface Investment {
  id: string
  title: string
  symbol?: string | null
  monthly_amount: number
  /**
   * 목표 기간(년).
   * - number (>0): 목표형(Goal Mode) - 진행률/종료일/남은 기간 계산
   * - null | 0: 적립형(Habit Mode) - 목표 기간 없이 꾸준히 적립 (streak/누적액 기준)
   */
  period_years: number | null
  annual_rate: number
  expected_amount: string
  created_at: string
  start_date?: string // 투자 시작일 (없으면 created_at 사용)
  investment_days?: number[] // 매월 투자하는 날짜들 (예: [5, 25] = 매월 5일, 25일)
  is_custom_rate?: boolean | null // 수익률 직접 입력/수정 여부
  notification_enabled?: boolean // 해당 투자에 대한 리마인더 알림 on/off (records.notification_enabled)
  market?: 'KR' | 'US' | null // 투자 시장 구분 (한국/미국)
  // DB DEFAULT 'amount'라 SELECT 결과는 항상 채워짐
  unit_type: InvestmentUnitType
  // 주수 모드일 때만 값 보유 (정수, >0). 금액 모드는 null.
  monthly_shares?: number | null
}

/**
 * 주수 모드 여부 판별
 */
export function isShareMode(investment: Pick<Investment, 'unit_type'>): boolean {
  return investment.unit_type === 'shares'
}

/**
 * 투자 모드(Goal/Habit) 판별
 * - period_years 가 없거나 0 이면 적립형(Habit Mode)
 */
export function isHabitMode(investment: Pick<Investment, 'period_years'>): boolean {
  return !investment.period_years || investment.period_years <= 0
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

