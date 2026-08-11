/**
 * 적립 항목 추가/수정 폼의 입력 상한.
 *
 * 상한이 없으면 아주 긴 이름이 앱바 제목·홈 카드·알림 문구를 깨뜨리고,
 * 만원 단위 15자리 같은 값은 저장 시 1e19대의 비현실적인 금액이 된다.
 * 세 값 모두 "정상적으로 쓸 수 있는 범위는 그대로 두되, 화면/데이터를 망가뜨리는
 * 극단값만 막는다"를 기준으로 정했다. (이슈 #73)
 */

/** 항목 이름 최대 길이(글자). 앱바 제목·홈 카드·알림 문구가 깨지지 않는 선. */
export const MAX_ITEM_NAME_LENGTH = 30

/** 월 납입액 입력 최대 자릿수(만원 단위). */
export const MAX_AMOUNT_DIGITS = 9

/**
 * 위 자릿수에서 파생한 월 납입액 상한(만원). 빠른 조절 칩으로도 이 값을 넘지 않는다.
 * 999,999,999만원 ≈ 10조 원대까지 허용한다.
 */
export const MAX_AMOUNT_MANWON = 10 ** MAX_AMOUNT_DIGITS - 1

/** 약정 연이율 상한(%). 유효 범위는 0 < r ≤ 20이며, 999% 같은 극단값을 막는다. */
export const MAX_INTEREST_RATE = 20

/**
 * 만원 단위 금액 문자열을 정규화한다: 숫자만 남기고 최대 자릿수로 자른 뒤 천 단위 콤마 표기.
 * 빈 값이면 ''을 반환한다. 붙여넣기·조합 입력까지 한 곳에서 상한을 강제하기 위한 공통 함수.
 */
export function normalizeAmountInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, MAX_AMOUNT_DIGITS)
  if (digits === '') return ''
  return parseInt(digits, 10).toLocaleString()
}

/** 만원 단위 금액을 상한 이내로 클램프한 뒤 콤마 표기 문자열로 돌려준다. 0이면 ''. */
export function clampAmountManwon(value: number): string {
  const clamped = Math.min(MAX_AMOUNT_MANWON, Math.max(0, value))
  return clamped === 0 ? '' : clamped.toLocaleString()
}
