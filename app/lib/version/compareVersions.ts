/**
 * semver 형식의 두 버전 문자열 비교 ("1.0.2" vs "1.0.1")
 * - a > b 이면 양수, a < b 이면 음수, 같으면 0
 * - 잘못된 입력은 0 반환 (안전한 기본값)
 */
export function compareVersions(a: string, b: string): number {
  if (!a || !b) return 0
  const pa = a.split('.').map((n) => Number(n) || 0)
  const pb = b.split('.').map((n) => Number(n) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}
