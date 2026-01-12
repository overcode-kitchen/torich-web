import { differenceInMonths, addMonths, format, isBefore, isAfter } from 'date-fns'

/**
 * 개월 수를 "X년 Y개월" 형태의 문자열로 변환
 * - 개월 수가 0이면 생략 (예: "1년 0개월" -> "1년")
 * - 년도가 0이면 생략 (예: "0년 10개월" -> "10개월")
 */
export function formatDuration(totalMonths: number): string {
  const absMonths = Math.abs(totalMonths)
  const years = Math.floor(absMonths / 12)
  const months = absMonths % 12

  if (years === 0 && months === 0) {
    return '0개월'
  }

  const parts: string[] = []
  if (years > 0) {
    parts.push(`${years}년`)
  }
  if (months > 0) {
    parts.push(`${months}개월`)
  }

  return parts.join(' ')
}

/**
 * 시작일과 목표 기간(년)을 기반으로 종료일 계산
 */
export function calculateEndDate(startDate: Date, periodYears: number): Date {
  return addMonths(startDate, periodYears * 12)
}

/**
 * 남은 기간 계산 (오늘 기준 종료일까지)
 * @returns 남은 개월 수 (음수면 이미 지남)
 */
export function getRemainingMonths(endDate: Date): number {
  const today = new Date()
  return differenceInMonths(endDate, today)
}

/**
 * 경과된 기간 계산 (시작일부터 오늘까지)
 * @returns 경과 개월 수
 */
export function getElapsedMonths(startDate: Date): number {
  const today = new Date()
  return differenceInMonths(today, startDate)
}

/**
 * 진행률 계산 (0 ~ 100)
 * @param startDate 시작일
 * @param periodYears 목표 기간(년)
 */
export function calculateProgress(startDate: Date, periodYears: number): number {
  const totalMonths = periodYears * 12
  const elapsedMonths = getElapsedMonths(startDate)
  
  if (elapsedMonths <= 0) return 0
  if (elapsedMonths >= totalMonths) return 100
  
  return Math.round((elapsedMonths / totalMonths) * 100)
}

/**
 * 남은 기간 텍스트 생성
 * - 남았으면: "X년 Y개월 남음"
 * - 지났으면: "목표 달성! 🎉"
 */
export function getRemainingText(startDate: Date, periodYears: number): string {
  const endDate = calculateEndDate(startDate, periodYears)
  const remainingMonths = getRemainingMonths(endDate)
  
  if (remainingMonths <= 0) {
    return '목표 달성! 🎉'
  }
  
  return `${formatDuration(remainingMonths)} 남음`
}

/**
 * 진행 기간 텍스트 생성
 * - "X년 Y개월째 도전 중 🔥"
 */
export function getElapsedText(startDate: Date): string {
  const elapsedMonths = getElapsedMonths(startDate)
  
  if (elapsedMonths <= 0) {
    return '막 시작했어요! 🚀'
  }
  
  return `${formatDuration(elapsedMonths)}째 도전 중 🔥`
}

/**
 * 날짜를 YYYY.MM 형식으로 포맷
 */
export function formatYearMonth(date: Date): string {
  return format(date, 'yyyy.MM')
}

/**
 * 목표 기간이 완료되었는지 확인
 */
export function isCompleted(startDate: Date, periodYears: number): boolean {
  const endDate = calculateEndDate(startDate, periodYears)
  return isAfter(new Date(), endDate)
}

