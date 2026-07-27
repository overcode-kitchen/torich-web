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

export interface QuickAdjust {
  label: string
  delta: number
}

/**
 * 현재 금액대에 맞는 빠른 조정 칩 (만원 단위 delta).
 *
 * 칩은 단순 편의 버튼이 아니라 "이 앱이 기대하는 금액대" 신호다. 백만원 눈금만 두면
 * 만원씩 모으는 사람은 자기 자리가 아니라고 읽는다. 그렇다고 8개를 다 깔면 좁은 화면에서
 * 두 줄이 되므로, 현재 값에 따라 눈금 한 쌍(굵게·잘게)만 노출한다.
 *
 * - 100만 미만: +10만 / +1만 (적립 항목 금액칸과 같은 눈금)
 * - 1,000만 미만: +100만 / +10만
 * - 그 이상: +1,000만 / +100만 (기존 눈금)
 */
export const getTargetQuickAdjusts = (won: string): QuickAdjust[] => {
  const amount = Number(won) || 0
  const step = amount < 1_000_000 ? 1 : amount < 10_000_000 ? 10 : 100
  return [step * 10, step].flatMap((unit) => {
    const label = `${unit.toLocaleString('ko-KR')}만`
    return [
      { label: `+${label}`, delta: unit },
      { label: `-${label}`, delta: -unit },
    ]
  })
}

/** 마감일 헬프텍스트 — 추가/수정 공통 문구 */
export const GOAL_DEADLINE_HELP =
  '마감일이 있으면 그때까지의 예상 금액도 같이 보여드려요.'
