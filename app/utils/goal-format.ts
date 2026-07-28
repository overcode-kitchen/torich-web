export function fmt(value: number): string {
  return value.toLocaleString('ko-KR')
}

/**
 * 원 단위 금액을 "1억 2,000만원" / "120만원"처럼 줄여 쓴다.
 * 한 줄에 모은 금액과 목표 금액을 나란히 놓는 자리처럼, 원 단위까지 읽을 필요가 없고
 * 폭이 빠듯한 곳에서 쓴다. 만원 미만은 줄일 게 없어 그대로 원으로 적는다.
 */
export function shortWon(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs < 10000) return `${sign}${fmt(abs)}원`
  const eok = Math.floor(abs / 100000000)
  const manwon = Math.floor((abs % 100000000) / 10000)
  if (eok > 0) {
    return manwon > 0 ? `${sign}${fmt(eok)}억 ${fmt(manwon)}만원` : `${sign}${fmt(eok)}억원`
  }
  return `${sign}${fmt(manwon)}만원`
}

export function dDayLabel(dDay: number | null): string {
  if (dDay === null) return ''
  if (dDay > 0) return `D-${dDay}`
  if (dDay === 0) return 'D-DAY'
  return `D+${Math.abs(dDay)}`
}
