import type { Goal } from '@/app/types/goal'

/**
 * 도착 시점(페이스)을 계산할 수 있는 목적인지 — 마감일과 목표 금액이 둘 다 있어야 한다.
 *
 * 통계 목표 탭의 두 카드가 이 조건으로 담당을 나눈다.
 * - true  → 목표별 페이스(달성% vs 지나온 시간%)
 * - false → 기한 없는 목적(진척률만)
 *
 * 한쪽만 조건을 바꾸면 목적이 두 번 나오거나 아예 사라지므로 판정은 이 함수 하나로만 한다.
 */
export function hasArrivalEstimate(goal: Goal): boolean {
  return goal.target_date !== null && goal.target_amount > 0
}
