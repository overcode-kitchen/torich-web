import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * 이 저장소가 `app/globals.css`의 `@theme`에 정의한 폰트 스케일 토큰(`--text-*`).
 *
 * tailwind-merge는 CSS에 정의된 Tailwind v4 테마를 읽지 못한다. 그래서 등록하지 않으면
 * `text-caption` 같은 토큰을 font-size가 아니라 **text-color로 오인**해,
 * `cn('text-primary-foreground', 'text-body')` 에서 글자색이 조용히 사라진다(반대로 크기가 사라지기도 한다).
 *
 * 이 배열은 `globals.css`의 `--text-*`와 1:1로 같아야 하며,
 * `scripts/check-font-token-sync.mjs`가 커밋 시점에 그 일치를 강제한다.
 */
export const FONT_SIZE_TOKENS = [
  'micro',
  'caption',
  'label',
  'body',
  'heading',
  'title',
  'display',
  'display-lg',
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...FONT_SIZE_TOKENS] }],
    },
  },
})

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

