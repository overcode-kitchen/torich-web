import type { Goal } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'

/**
 * 목적의 파생 상태.
 * - 'in_progress': 진행 중
 * - 'pending_settlement': 종료 트리거는 도달했지만 묶인 적금이 만기 대기 중 (지연 정산)
 * - 'completed': 완료 (수동/자동 결산 끝)
 *
 * 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
 */
export type GoalStatus = 'in_progress' | 'pending_settlement' | 'completed'

interface DeriveGoalStatusInput {
  goal: Pick<Goal, 'id' | 'target_date' | 'target_amount' | 'completed_at'>
  /** 이 목적에 묶인 records (caller가 goal_id로 사전 필터링). */
  linkedRecords: Pick<Investment, 'maturity_date' | 'settled_at'>[]
  /** 누적 모금액 (external_amount 포함 여부는 caller가 결정). */
  accumulatedAmount: number
  /** 비교 기준 시각. 테스트 시 명시 주입. */
  now: Date
}

/**
 * 목적의 현재 상태를 파생 계산한다.
 *
 * 판정 우선순위:
 * 1. completed_at이 명시되어 있으면 → 'completed' (수동 완료)
 * 2. 종료 트리거(날짜 OR 금액) 미충족 → 'in_progress'
 * 3. 종료 트리거 충족 + 묶인 적금 중 미정산·만기 미도달 존재 → 'pending_settlement'
 * 4. 종료 트리거 충족 + 대기할 적금 없음 → 'completed'
 */
export function deriveGoalStatus({
  goal,
  linkedRecords,
  accumulatedAmount,
  now,
}: DeriveGoalStatusInput): GoalStatus {
  if (goal.completed_at) return 'completed'

  const dateTriggered = goal.target_date ? new Date(goal.target_date) <= now : false
  const amountTriggered =
    goal.target_amount > 0 && accumulatedAmount >= goal.target_amount

  if (!dateTriggered && !amountTriggered) return 'in_progress'

  const hasPendingSettlement = linkedRecords.some((r) =>
    isPendingSettlement(r, now)
  )
  return hasPendingSettlement ? 'pending_settlement' : 'completed'
}

/**
 * 단일 record가 "정산 대기" 조건인지: 만기일이 있고, 아직 만기 전이며, 정산되지 않음.
 */
export function isPendingSettlement(
  record: Pick<Investment, 'maturity_date' | 'settled_at'>,
  now: Date
): boolean {
  if (!record.maturity_date) return false
  if (record.settled_at) return false
  return new Date(record.maturity_date) > now
}

/**
 * 단일 record가 "정산 대상" 조건인지: 만기일이 도달했지만 아직 정산되지 않음.
 * 자동 정산 트리거(Phase 4)에서 사용. 케이스 B 처리의 핵심 검사.
 */
export function isMaturedAndUnsettled(
  record: Pick<Investment, 'maturity_date' | 'settled_at'>,
  now: Date
): boolean {
  if (!record.maturity_date) return false
  if (record.settled_at) return false
  return new Date(record.maturity_date) <= now
}
