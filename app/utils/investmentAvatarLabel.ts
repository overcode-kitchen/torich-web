/** 투자 종목명 첫 글자(한글·영문)로 아바타 라벨 생성 */
export function getInvestmentAvatarLabel(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return '?'

  const firstChar = trimmed[0]
  const code = firstChar.charCodeAt(0)

  if (code >= 0xac00 && code <= 0xd7a3) {
    return firstChar
  }

  return firstChar.toUpperCase()
}
