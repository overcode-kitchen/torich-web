/**
 * 말일(29~31일) 회차 규칙 테스트.
 *
 * 화면(app/utils/monthly-installments.ts)과 알림(이 디렉터리)이 같은 날짜에
 * 답하는지를 지킨다. 규칙이 두 벌로 존재하는 이유는 Deno가 app/ 코드를
 * import할 수 없어서다 — 그래서 여기서 두 구현을 나란히 놓고 비교한다. (#239)
 *
 * 실행: deno test supabase/functions/_shared/notification-schedule.test.ts
 */
import { clampDayToMonth, generatePaymentDates } from './notification-schedule.ts'
import { clampDayToMonth as appClampDayToMonth } from '../../../app/utils/monthly-installments.ts'

// 표준 라이브러리를 받아오지 않아도 오프라인에서 그대로 돌도록 비교기를 직접 둔다.
function assertEquals(actual: unknown, expected: unknown, message?: string): void {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) {
    throw new Error(`${message ? message + ' — ' : ''}기대 ${b}, 실제 ${a}`)
  }
}

/** 로컬 시각 기준 YYYY-MM-DD (generatePaymentDates가 로컬 Date를 만든다) */
function ymd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

Deno.test('clampDayToMonth: 그 달에 없는 날은 말일로 당긴다', () => {
  assertEquals(clampDayToMonth(31, 2026, 6), 30) // 6월 31일 → 30일
  assertEquals(clampDayToMonth(31, 2026, 7), 31) // 있는 날은 그대로
  assertEquals(clampDayToMonth(30, 2026, 2), 28) // 평년 2월
  assertEquals(clampDayToMonth(29, 2024, 2), 29) // 윤년 2월
  assertEquals(clampDayToMonth(29, 2026, 2), 28) // 평년 2월
  assertEquals(clampDayToMonth(1, 2026, 2), 1)
})

Deno.test('clampDayToMonth: 앱 구현과 모든 달·말일 후보에서 같은 답을 낸다', () => {
  for (const year of [2024, 2025, 2026]) {
    for (let month = 1; month <= 12; month++) {
      for (const day of [1, 15, 28, 29, 30, 31]) {
        assertEquals(
          clampDayToMonth(day, year, month),
          appClampDayToMonth(day, year, month),
          `${year}-${month} ${day}일에서 화면과 알림의 답이 다르다`,
        )
      }
    }
  }
})

Deno.test('generatePaymentDates: 31일 회차가 짧은 달에도 빠지지 않는다', () => {
  const dates = generatePaymentDates('2026-01-31', 1, [31]).map(ymd)

  // 시작월부터 종료월까지 한 달도 빠지지 않는다 (건너뛰던 시절엔 절반이 사라졌다).
  // 커서가 시작월 1일이라 종료월(2027-01)도 한 번 도는 것은 기존 동작이다.
  assertEquals(dates.length, 13)
  assertEquals(dates.includes('2026-06-30'), true) // 6월 → 30일로 당김
  assertEquals(dates.includes('2026-02-28'), true) // 평년 2월 → 28일
  assertEquals(dates.includes('2026-07-31'), true) // 있는 달은 그대로
})

Deno.test('generatePaymentDates: 당김으로 겹치는 회차는 한 번만 잡는다', () => {
  const dates = generatePaymentDates('2026-06-01', 1, [30, 31])
    .map(ymd)
    .filter((d) => d.startsWith('2026-06'))

  assertEquals(dates, ['2026-06-30']) // 30·31 → 30 하나
})

Deno.test('generatePaymentDates: 윤년 2월은 29일로 잡힌다', () => {
  const dates = generatePaymentDates('2024-01-31', 1, [31]).map(ymd)

  assertEquals(dates.includes('2024-02-29'), true)
})

Deno.test('generatePaymentDates: 정상 달의 일반 회차는 그대로 하루만 잡힌다 (회귀)', () => {
  const dates = generatePaymentDates('2026-01-15', 1, [15]).map(ymd)

  assertEquals(dates.length, 13)
  assertEquals(dates[0], '2026-01-15')
  assertEquals(dates[dates.length - 1], '2027-01-15')
  assertEquals(new Set(dates).size, 13) // 중복 없음
})
