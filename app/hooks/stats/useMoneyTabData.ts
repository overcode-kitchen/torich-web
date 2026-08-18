'use client'

import { useMemo } from 'react'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { useGoalsProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { buildCumulativePrincipal, type CumulativePrincipal } from '@/app/utils/cumulative-principal'
import {
  buildGoalComposition,
  buildRecordTypeShare,
  type CompositionSlice,
  type TypeShareTile,
} from '@/app/utils/money-composition'
import type { Investment } from '@/app/types/investment'
import type { Goal } from '@/app/types/goal'

interface UseMoneyTabDataProps {
  /** 완료분까지 포함한 전체 기록 — 누적 원금은 기간이 끝난 기록도 세야 한다 */
  records: Investment[]
  goals: Goal[]
}

export interface MoneyTabData {
  cumulative: CumulativePrincipal
  composition: CompositionSlice[]
  typeShare: TypeShareTile[]
}

/**
 * 모은 돈 탭의 세 데이터셋(누적 곡선·목적별 구성·유형 비중)을 한 번에 만든다.
 *
 * 납입 기록은 page에서 prop으로 내리지 않고 여기서 컨텍스트로 직접 읽는다. 세 계산이 전부 같은
 * 맵(완료·소급·캡처 금액)을 쓰는데 그걸 prop으로 세 단계 내리면 탭마다 쓰지도 않는 값이 따라다닌다.
 */
export function useMoneyTabData({ records, goals }: UseMoneyTabDataProps): MoneyTabData {
  const { completedPayments, retroactivePayments, capturedAmounts } = usePaymentHistoryContext()

  // 목적 조각 금액은 진척·페이스 카드와 같은 계산을 써야 서로 어긋나지 않는다
  const progressMap = useGoalsProgress(
    goals,
    records,
    completedPayments,
    retroactivePayments,
    capturedAmounts
  )

  const cumulative = useMemo(
    () =>
      buildCumulativePrincipal(
        records,
        goals,
        completedPayments,
        retroactivePayments,
        capturedAmounts
      ),
    [records, goals, completedPayments, retroactivePayments, capturedAmounts]
  )

  const composition = useMemo(
    () =>
      buildGoalComposition(
        goals,
        progressMap,
        records,
        completedPayments,
        retroactivePayments,
        capturedAmounts
      ),
    [goals, progressMap, records, completedPayments, retroactivePayments, capturedAmounts]
  )

  const typeShare = useMemo(
    () => buildRecordTypeShare(records, completedPayments, retroactivePayments, capturedAmounts),
    [records, completedPayments, retroactivePayments, capturedAmounts]
  )

  return { cumulative, composition, typeShare }
}
