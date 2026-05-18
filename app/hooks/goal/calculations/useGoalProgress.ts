'use client'

import { useMemo } from 'react'
import type { Goal, GoalProgress } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'
import { getStartDate } from '@/app/types/investment'
import type { PaymentHistoryMap } from '@/app/hooks/payment/usePaymentHistory'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

function monthsBetween(from: Date, to: Date): number {
  // 같은 달의 말일 차이를 부드럽게 잡기 위해 day까지 보정
  const yearDiff = to.getFullYear() - from.getFullYear()
  const monthDiff = to.getMonth() - from.getMonth()
  const dayAdjust = (to.getDate() - from.getDate()) / 30
  return yearDiff * 12 + monthDiff + dayAdjust
}

function paidCount(
  recordId: string,
  auto: PaymentHistoryMap,
  retro: PaymentHistoryMap,
): number {
  return (auto.get(recordId)?.size ?? 0) + (retro.get(recordId)?.size ?? 0)
}

/** 묶인 투자들의 실제 납입 원금 합 (auto + retroactive payment_history) */
function sumPaidPrincipal(
  records: Investment[],
  auto: PaymentHistoryMap,
  retro: PaymentHistoryMap,
): number {
  let total = 0
  for (const r of records) {
    if (!r.monthly_amount || r.monthly_amount <= 0) continue
    total += paidCount(r.id, auto, retro) * r.monthly_amount
  }
  return total
}

/** 오늘부터 byDate까지 추가 적립될 예상 원금 합 (투자 만기 cap 적용) */
function sumFuturePrincipal(
  records: Investment[],
  today: Date,
  byDate: Date,
): number {
  const monthsAhead = Math.max(0, Math.floor(monthsBetween(today, byDate)))
  if (monthsAhead === 0) return 0

  let total = 0
  for (const r of records) {
    if (!r.monthly_amount || r.monthly_amount <= 0) continue

    // 투자 만기까지 남은 개월수 계산 (적립형은 무제한)
    const periodMonths = (r.period_years ?? 0) * 12
    let allowedMonths = monthsAhead
    if (periodMonths > 0) {
      const start = getStartDate(r)
      const elapsed = Math.max(0, Math.floor(monthsBetween(start, today)))
      const remaining = Math.max(0, periodMonths - elapsed)
      allowedMonths = Math.min(monthsAhead, remaining)
    }
    total += allowedMonths * r.monthly_amount
  }
  return total
}

function calculateGoalProgress(
  goal: Goal,
  linkedRecords: Investment[],
  auto: PaymentHistoryMap,
  retro: PaymentHistoryMap,
): GoalProgress {
  const today = new Date()
  const targetDate = goal.target_date ? new Date(goal.target_date) : null

  const paidPrincipal = sumPaidPrincipal(linkedRecords, auto, retro)
  const currentValue = goal.external_amount + paidPrincipal

  const projectedValue =
    targetDate !== null
      ? goal.external_amount +
        paidPrincipal +
        sumFuturePrincipal(linkedRecords, today, targetDate)
      : null

  // 목표 금액이 없는 목적은 진행률·완료 판정을 하지 않는다.
  const hasTarget = goal.target_amount > 0
  const progressPercent = hasTarget
    ? Math.round((currentValue / goal.target_amount) * 100)
    : null
  const projectedProgressPercent =
    hasTarget && projectedValue !== null
      ? Math.round((projectedValue / goal.target_amount) * 100)
      : null

  const dDay = targetDate ? diffDays(today, targetDate) : null
  const isCompleted = hasTarget && currentValue >= goal.target_amount

  return {
    goalId: goal.id,
    currentValue: Math.round(currentValue),
    projectedValue: projectedValue !== null ? Math.round(projectedValue) : null,
    progressPercent,
    projectedProgressPercent,
    dDay,
    isCompleted,
  }
}

const EMPTY_MAP: PaymentHistoryMap = new Map()

/**
 * 단일 목적의 진척도 계산.
 * - 현재값: 외부 자산 + 묶인 투자들의 실제 납입 원금 (payment_history 기반)
 * - 예상값: 위 + 오늘~target_date 사이 추가 적립될 원금 (투자 만기 cap)
 * - payment_history map이 없으면 0 납입으로 취급
 */
export function useGoalProgress(
  goal: Goal | null,
  records: Investment[],
  completedPayments: PaymentHistoryMap = EMPTY_MAP,
  retroactivePayments: PaymentHistoryMap = EMPTY_MAP,
): GoalProgress | null {
  return useMemo(() => {
    if (!goal) return null
    const linked = records.filter((r) => r.goal_id === goal.id)
    return calculateGoalProgress(
      goal,
      linked,
      completedPayments,
      retroactivePayments,
    )
  }, [goal, records, completedPayments, retroactivePayments])
}

/**
 * 여러 목적의 진척도를 한 번에 계산 (홈 카드 캐러셀용).
 */
export function useGoalsProgress(
  goals: Goal[],
  records: Investment[],
  completedPayments: PaymentHistoryMap = EMPTY_MAP,
  retroactivePayments: PaymentHistoryMap = EMPTY_MAP,
): Map<string, GoalProgress> {
  return useMemo(() => {
    const map = new Map<string, GoalProgress>()
    for (const goal of goals) {
      const linked = records.filter((r) => r.goal_id === goal.id)
      map.set(
        goal.id,
        calculateGoalProgress(
          goal,
          linked,
          completedPayments,
          retroactivePayments,
        ),
      )
    }
    return map
  }, [goals, records, completedPayments, retroactivePayments])
}
