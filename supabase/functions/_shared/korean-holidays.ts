/**
 * 한국 공휴일 데이터 + 영업일 보정 헬퍼
 *
 * KST(UTC+9) 기준 YYYY-MM-DD 문자열 집합으로 보관.
 * 매년 말 다음 해 공휴일을 추가해 주어야 한다.
 * 출처: 관공서의 공휴일에 관한 규정 (대체공휴일 포함)
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

const KOREAN_HOLIDAYS_KST: ReadonlySet<string> = new Set([
  // 2026
  '2026-01-01', // 신정
  '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
  '2026-03-01', '2026-03-02', // 삼일절(일) + 대체공휴일(월)
  '2026-05-05', // 어린이날
  '2026-05-24', '2026-05-25', // 부처님오신날(일) + 대체공휴일(월)
  '2026-06-06', // 현충일(토)
  '2026-08-15', // 광복절(토)
  '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-28', // 추석 연휴(목금토) + 대체공휴일(월)
  '2026-10-03', // 개천절(토)
  '2026-10-09', // 한글날(금)
  '2026-12-25', // 성탄절(금)

  // 2027
  '2027-01-01',
  '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', // 설날(토일월) + 대체공휴일(화)
  '2027-03-01',
  '2027-05-05',
  '2027-05-13', // 부처님오신날
  '2027-06-06', '2027-06-07', // 현충일(일) + 대체공휴일(월)
  '2027-08-15', '2027-08-16', // 광복절(일) + 대체공휴일(월)
  '2027-09-14', '2027-09-15', '2027-09-16', // 추석 연휴(화수목)
  '2027-10-03', '2027-10-04', // 개천절(일) + 대체공휴일(월)
  '2027-10-09', '2027-10-11', // 한글날(토) + 대체공휴일(월)
  '2027-12-25',

  // 2028
  '2028-01-01', // 신정(토)
  '2028-01-26', '2028-01-27', '2028-01-28', // 설날 연휴(수목금)
  '2028-03-01',
  '2028-05-02', // 부처님오신날
  '2028-05-05', // 어린이날
  '2028-06-06',
  '2028-08-15',
  '2028-10-02', '2028-10-03', '2028-10-04', // 추석 연휴(월화수, 10/3은 개천절과 겹침)
  '2028-10-09',
  '2028-12-25',

  // 2029
  '2029-01-01',
  '2029-02-12', '2029-02-13', '2029-02-14', // 설날 연휴(월화수)
  '2029-03-01',
  '2029-05-05', '2029-05-07', // 어린이날(토) + 대체공휴일(월)
  '2029-05-20', '2029-05-21', // 부처님오신날(일) + 대체공휴일(월)
  '2029-06-06',
  '2029-08-15',
  '2029-09-21', '2029-09-22', '2029-09-23', '2029-09-24', // 추석 연휴(금토일) + 대체공휴일(월)
  '2029-10-03',
  '2029-10-09',
  '2029-12-25',

  // 2030
  '2030-01-01',
  '2030-02-02', '2030-02-03', '2030-02-04', '2030-02-05', // 설날(토일월) + 대체공휴일(화)
  '2030-03-01',
  '2030-05-05', '2030-05-06', // 어린이날(일) + 대체공휴일(월)
  '2030-05-09', // 부처님오신날
  '2030-06-06',
  '2030-08-15',
  '2030-09-11', '2030-09-12', '2030-09-13', // 추석 연휴(수목금)
  '2030-10-03',
  '2030-10-09',
  '2030-12-25',
])

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Date를 KST 기준 YYYY-MM-DD 문자열로 변환 */
function toKSTDateString(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS)
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}`
}

/** KST 기준 토요일(6) / 일요일(0) 여부 */
export function isWeekendKST(date: Date): boolean {
  const kst = new Date(date.getTime() + KST_OFFSET_MS)
  const day = kst.getUTCDay()
  return day === 0 || day === 6
}

/** KST 기준 공휴일 여부 */
export function isKoreanHoliday(date: Date): boolean {
  return KOREAN_HOLIDAYS_KST.has(toKSTDateString(date))
}

/** KST 기준 비영업일(주말/공휴일) 여부 */
export function isNonBusinessDayKST(date: Date): boolean {
  return isWeekendKST(date) || isKoreanHoliday(date)
}

/**
 * 비영업일이면 다음 영업일로 미루어 반환.
 * 영업일이면 그대로 반환.
 * 시각(시/분/초)은 보존된다.
 */
export function adjustToNextBusinessDayKST(date: Date): Date {
  const result = new Date(date)
  // 무한루프 방지: 최대 14일까지만 탐색 (연속 공휴일 + 주말 안전 마진)
  for (let i = 0; i < 14; i++) {
    if (!isNonBusinessDayKST(result)) return result
    result.setUTCDate(result.getUTCDate() + 1)
  }
  return result
}

/** YYYY-MM-DD 문자열의 KST 기준 비영업일 여부 */
export function isNonBusinessDateStringKST(dateStr: string): boolean {
  if (KOREAN_HOLIDAYS_KST.has(dateStr)) return true
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return false
  // KST 자정을 UTC 기준 -9시간으로 표현해 요일 계산 → 결과는 KST 요일과 동일
  const utcDate = new Date(Date.UTC(y, m - 1, d))
  const day = utcDate.getUTCDay()
  return day === 0 || day === 6
}

/**
 * YYYY-MM-DD 문자열을 받아 비영업일이면 다음 영업일 문자열을 반환.
 * 영업일이면 그대로 반환.
 */
export function adjustToNextBusinessDateStringKST(dateStr: string): string {
  let current = dateStr
  for (let i = 0; i < 14; i++) {
    if (!isNonBusinessDateStringKST(current)) return current
    const [y, m, d] = current.split('-').map(Number)
    const next = new Date(Date.UTC(y, m - 1, d + 1))
    current = `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
  }
  return current
}
