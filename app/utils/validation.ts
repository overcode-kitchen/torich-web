export interface ValidationResult {
  isValid: boolean
  errorMessage?: string
}

export interface InvestmentFormData {
  stockName: string
  monthlyAmount: string
  period: string
  /** 적립형(목표 기간 없음) 여부 */
  isHabitMode?: boolean
  userId: string | null
  investmentDays: number[]
}

export function validateInvestmentForm(data: InvestmentFormData): ValidationResult {
  if (!data.stockName.trim()) {
    return {
      isValid: false,
      errorMessage: '종목명을 입력해주세요.'
    }
  }

  if (!data.monthlyAmount || parseInt(data.monthlyAmount.replace(/,/g, '')) <= 0) {
    return {
      isValid: false,
      errorMessage: '월 투자액을 입력해주세요.'
    }
  }

  // 적립형은 기간 입력을 건너뛴다
  if (!data.isHabitMode && (!data.period || parseInt(data.period) <= 0)) {
    return {
      isValid: false,
      errorMessage: '투자 기간을 입력하거나 "목표 기간 없이 적립하기"를 선택해주세요.'
    }
  }

  if (!data.userId) {
    return {
      isValid: false,
      errorMessage: '로그인이 필요합니다.'
    }
  }

  if (data.investmentDays.length === 0) {
    return {
      isValid: false,
      errorMessage: '매월 투자일을 선택해주세요. 알림을 받을 날짜를 선택하면 투자 일정을 쉽게 관리할 수 있어요.'
    }
  }

  return { isValid: true }
}

export function validateManualInput(stockName: string, rate: string): ValidationResult {
  if (!stockName.trim()) {
    return {
      isValid: false,
      errorMessage: '종목 이름을 입력해주세요.'
    }
  }

  const parsedRate = parseFloat(rate)
  if (!rate || Number.isNaN(parsedRate) || parsedRate <= 0) {
    return {
      isValid: false,
      errorMessage: '예상 수익률을 입력해주세요.'
    }
  }

  return { isValid: true }
}

// 새로운 통합 유효성 검사 함수
export function validateAndHandleError(
  validation: ValidationResult,
  onError?: (message: string) => void,
  onLoginRequired?: () => void
): boolean {
  if (!validation.isValid) {
    const message = validation.errorMessage || '유효성 검사에 실패했습니다.'
    onError?.(message)
    
    if (message.includes('로그인')) {
      onLoginRequired?.()
    }
    
    return false
  }
  return true
}
