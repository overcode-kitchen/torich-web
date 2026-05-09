export function fmt(value: number): string {
  return value.toLocaleString('ko-KR')
}

export function dDayLabel(dDay: number | null): string {
  if (dDay === null) return ''
  if (dDay > 0) return `D-${dDay}`
  if (dDay === 0) return 'D-DAY'
  return `D+${Math.abs(dDay)}`
}
