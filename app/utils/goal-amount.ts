/**
 * 목적(goal) 금액 입력 변환 헬퍼 — 추가/수정 양쪽 폼이 공유하는 단일 진실 출처.
 * 목적 금액은 DB에 원(won) 단위로 저장되지만, 입력 UI는 만원 단위로 받는다.
 */

/** 숫자 외 문자 제거 */
export const onlyDigits = (raw: string): string => raw.replace(/[^\d]/g, '')

/** 원(won) 정수 문자열 → 만원 정수 문자열 (콤마 포함). 입력 표시용. */
export const wonToManwonDisplay = (won: string): string => {
  if (!won) return ''
  const manwon = Math.floor(Number(won) / 10000)
  return manwon.toLocaleString('ko-KR')
}

/** 사용자가 만원 단위로 입력한 값 → 원(won) 문자열 */
export const manwonInputToWon = (input: string): string => {
  const digits = onlyDigits(input)
  if (!digits) return ''
  return String(Number(digits) * 10000)
}

/** 현재 원(won) 값에서 만원 단위로 ±delta 적용 (음수 방지) */
export const adjustWonByManwon = (won: string, deltaManwon: number): string => {
  const baseManwon = won ? Math.floor(Number(won) / 10000) : 0
  const next = Math.max(0, baseManwon + deltaManwon)
  return String(next * 10000)
}

/** 목표 금액 빠른 조정 칩 (만원 단위 delta) */
export const TARGET_QUICK_ADJUSTS: { label: string; delta: number }[] = [
  { label: '+1,000만', delta: 1000 },
  { label: '-1,000만', delta: -1000 },
  { label: '+100만', delta: 100 },
  { label: '-100만', delta: -100 },
]

/** 마감일 헬프텍스트 — 추가/수정 공통 문구 */
export const GOAL_DEADLINE_HELP =
  '마감일이 있으면 그때까지의 예상 금액도 같이 보여드려요.'
