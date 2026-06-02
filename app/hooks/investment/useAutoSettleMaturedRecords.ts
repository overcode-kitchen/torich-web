'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useGoals } from '@/app/hooks/goal/data/useGoals'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import { toastSuccess } from '@/app/utils/toast'
import { calculateSavingsMaturity } from '@/app/utils/savingsMaturity'
import { isMaturedAndUnsettled } from '@/app/utils/goal-status'
import { formatCurrency } from '@/lib/utils'

/**
 * 앱 진입 시 만기 도달 + 미정산 예적금 record들을 자동으로 정산 처리한다.
 * - records.settled_at 을 현재 시각으로 채움 (updateInvestment 경유 → DB + 로컬 상태 동기)
 * - 사용자에게 비차단 토스트로 안내 (케이스 B 처리의 최종 가시화)
 * - 세션당 record당 한 번만 처리 (재실행 방지) → 실패 시 재시도 허용
 *
 * 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
 */
export function useAutoSettleMaturedRecords(): void {
  const { records, updateInvestment } = useInvestmentsContext()
  const { user } = useAuth()
  const { goals } = useGoals(user?.id)
  const processedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user?.id || records.length === 0) return

    const now = new Date()
    const candidates = records.filter(
      (r) =>
        !processedRef.current.has(r.id) &&
        r.record_type === 'savings' &&
        isMaturedAndUnsettled(r, now),
    )
    if (candidates.length === 0) return

    void (async () => {
      for (const record of candidates) {
        // 즉시 마킹해 같은 effect가 다음 렌더에 재처리하는 것을 막는다.
        processedRef.current.add(record.id)

        try {
          const settledAt = new Date().toISOString()
          await updateInvestment(record.id, { settled_at: settledAt })

          const maturity = calculateSavingsMaturity(record)
          const totalLabel = maturity ? formatCurrency(maturity.total) : null
          const linkedGoal = record.goal_id
            ? goals.find((g) => g.id === record.goal_id) ?? null
            : null

          toastSuccess(buildSettlementToastMessage(record.title, totalLabel, linkedGoal?.name))
        } catch {
          // 실패 → 다음 진입 시 재시도 가능하도록 마킹 해제
          processedRef.current.delete(record.id)
        }
      }
    })()
  }, [records, updateInvestment, user?.id, goals])
}

function buildSettlementToastMessage(
  recordTitle: string,
  totalLabel: string | null,
  goalName: string | null | undefined,
): string {
  const amountPart = totalLabel ? `수령액 ${totalLabel}` : '수령액'
  if (goalName) {
    return `"${recordTitle}"이 만기됐어요. ${amountPart}이 "${goalName}"에 반영됐어요.`
  }
  return `"${recordTitle}"이 만기됐어요. ${amountPart}.`
}
