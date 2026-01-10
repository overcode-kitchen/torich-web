import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 금액을 억/만 단위로 포맷팅하는 함수 (소수점 제거)
 * @param amount - 원 단위 금액 (number) 또는 만원 단위 금액 (string)
 * @returns "X억 X만원" 또는 "XX만원" 형식의 문자열 (소수점 없음)
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num) || num === 0) {
    return '0원'
  }
  
  // 억 단위 처리 (소수점 제거)
  if (num >= 100000000) {
    const eok = Math.floor(num / 100000000)
    const remainder = num % 100000000
    if (remainder >= 10000) {
      const man = Math.floor(remainder / 10000)
      return `${eok}억 ${man}만원`
    }
    return `${eok}억원`
  } 
  // 만원 단위 처리 (소수점 제거)
  else if (num >= 10000) {
    const man = Math.floor(num / 10000)
    return `${man}만원`
  }
  // 원 단위 처리
  return `${Math.floor(num).toLocaleString()}원`
}
