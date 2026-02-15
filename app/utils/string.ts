/**
 * 문자열 처리 유틸리티
 */

/**
 * 종목명 등에서 첫 글자(이니셜) 추출
 * @param text 원본 문자열
 * @returns 첫 글자 (대문자 변환)
 */
export function getInitial(text: string): string {
    if (!text) return ''
    return text.charAt(0).toUpperCase()
}
