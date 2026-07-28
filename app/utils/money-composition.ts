import type { Investment } from '@/app/types/investment'
import { getRecordType } from '@/app/types/investment'
import type { Goal, GoalProgress } from '@/app/types/goal'
import type { CapturedAmountsMap, PaymentHistoryMap } from '@/app/types/payment'
import { getRecordRealizedPrincipal } from '@/app/utils/realized-principal'

export const OTHER_SLICE_KEY = '__other__'
export const UNASSIGNED_SLICE_KEY = '__unassigned__'

/**
 * 목적을 이만큼만 따로 보여주고 나머지는 '기타'로 묶는다.
 * 조각 색은 브랜드 그린 1개 + coolgray 4단계 = 5개까지만 서로 구분되므로
 * (목적 3 + 기타 + 목적 미지정)이 상한이다.
 */
const MAX_GOAL_SLICES = 3

export interface CompositionSlice {
  key: string
  label: string
  emoji: string | null
  amount: number
  /** 조각 비중(%) — 반올림해도 합이 정확히 100 */
  percent: number
}

/**
 * 반올림 오차로 합이 99/101이 되지 않도록 최대 잔여법으로 비중을 채운다.
 * (도넛에서 조각 합이 100%가 아니면 그 자체가 버그로 읽힌다)
 */
function withPercents<T extends { amount: number }>(items: T[]): Array<T & { percent: number }> {
  const total = items.reduce((sum, item) => sum + item.amount, 0)
  if (total <= 0) return items.map((item) => ({ ...item, percent: 0 }))

  const raw = items.map((item) => (item.amount / total) * 100)
  const percents = raw.map((v) => Math.floor(v))
  let remainder = 100 - percents.reduce((sum, v) => sum + v, 0)

  // 소수부가 큰 조각부터 남은 1%씩 나눠 준다
  const byFraction = raw
    .map((v, index) => ({ index, fraction: v - Math.floor(v) }))
    .sort((a, b) => b.fraction - a.fraction)
  for (const { index } of byFraction) {
    if (remainder <= 0) break
    percents[index] += 1
    remainder -= 1
  }

  return items.map((item, index) => ({ ...item, percent: percents[index] }))
}

/**
 * 목적별 구성 — "어디에 모여 있나".
 *
 * 목적 조각의 금액은 `useGoalsProgress`의 `currentValue`를 그대로 쓴다. 목적 진척·페이스 카드가
 * 쓰는 값과 같아야 같은 목적의 금액이 화면마다 달라지지 않는다. (정산된 예적금은 그쪽 기준대로
 * 만기 수령액이라, 조각 합이 hero의 '지금까지 모은 돈'보다 이자만큼 클 수 있다. 그래서 이 카드에는
 * 합계를 적지 않고 비중만 말한다 — 100%의 기준은 이 카드 안이다.)
 *
 * 치우침을 스스로 발견하게 하는 정보라 판정·잔소리 문구를 붙이지 않는다.
 */
export function buildGoalComposition(
  goals: Goal[],
  progressMap: Map<string, GoalProgress>,
  records: Investment[],
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  capturedAmounts: CapturedAmountsMap
): CompositionSlice[] {
  const goalSlices = goals
    .map((goal) => ({
      key: goal.id,
      label: goal.name,
      emoji: goal.emoji,
      amount: progressMap.get(goal.id)?.currentValue ?? 0,
    }))
    .filter((slice) => slice.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const slices = goalSlices.slice(0, MAX_GOAL_SLICES)
  const merged = goalSlices.slice(MAX_GOAL_SLICES)
  if (merged.length > 0) {
    slices.push({
      key: OTHER_SLICE_KEY,
      label: `기타 ${merged.length}개`,
      emoji: null,
      amount: merged.reduce((sum, slice) => sum + slice.amount, 0),
    })
  }

  // 목적에 묶이지 않은(또는 보관된 목적에 묶인) 기록 — 홈·히트맵과 같이 항상 마지막에 둔다
  const goalIds = new Set(goals.map((goal) => goal.id))
  const unassigned = records
    .filter((record) => !record.goal_id || !goalIds.has(record.goal_id))
    .reduce(
      (sum, record) =>
        sum +
        getRecordRealizedPrincipal(record, completedPayments, retroactivePayments, capturedAmounts),
      0
    )
  if (unassigned > 0) {
    slices.push({
      key: UNASSIGNED_SLICE_KEY,
      label: '목적 미지정',
      emoji: null,
      amount: unassigned,
    })
  }

  return withPercents(slices)
}

export interface TypeShareTile {
  key: 'investment' | 'deposit'
  label: string
  amount: number
  percent: number
}

/**
 * 유형 비중 — 주식·ETF / 예적금·현금.
 *
 * 같은 정보를 문장으로 쓰면 두 줄이 되므로 타일 두 칸으로 둔다. 유형이 없는 '이미 모은 돈'
 * (goal.external_amount)은 여기서 빠지므로 두 칸의 합은 hero 금액과 다를 수 있다 —
 * 그래서 이 타일도 합계가 아니라 비중을 말한다.
 */
export function buildRecordTypeShare(
  records: Investment[],
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  capturedAmounts: CapturedAmountsMap
): TypeShareTile[] {
  let investment = 0
  let deposit = 0

  for (const record of records) {
    const won = getRecordRealizedPrincipal(
      record,
      completedPayments,
      retroactivePayments,
      capturedAmounts
    )
    if (won <= 0) continue
    if (getRecordType(record) === 'investment') investment += won
    else deposit += won
  }

  return withPercents([
    { key: 'investment' as const, label: '주식·ETF', amount: investment },
    { key: 'deposit' as const, label: '예적금·현금', amount: deposit },
  ])
}
