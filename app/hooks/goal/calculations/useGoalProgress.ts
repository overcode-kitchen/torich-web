'use client'

import { useMemo } from 'react'
import type { Goal, GoalProgress } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'
import { getStartDate } from '@/app/types/investment'
import { calculateSimulatedValue } from '@/app/utils/finance'

// 예상값 계산 시 비현실적 폭주 방지용 연 수익률 cap (12%)
const ANNUAL_RATE_CAP = 0.12

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_YEAR = 365.25 * MS_PER_DAY

function diffYears(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / MS_PER_YEAR)
}

function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

function sumSimulated(records: Investment[], asOf: Date): number {
  let total = 0
  for (const r of records) {
    const start = getStartDate(r)
    const years = diffYears(start, asOf)
    if (years <= 0 || !r.monthly_amount || r.monthly_amount <= 0) continue
    const cappedRate = Math.min((r.annual_rate ?? 0) / 100, ANNUAL_RATE_CAP)
    total += calculateSimulatedValue(
      r.monthly_amount,
      years,
      r.period_years ?? null,
      cappedRate,
    )
  }
  return total
}

function calculateGoalProgress(goal: Goal, linkedRecords: Investment[]): GoalProgress {
  const today = new Date()
  const targetDate = goal.target_date ? new Date(goal.target_date) : null

  const currentValue = goal.external_amount + sumSimulated(linkedRecords, today)
  const projectedValue =
    targetDate !== null
      ? goal.external_amount + sumSimulated(linkedRecords, targetDate)
      : null

  const safeTarget = goal.target_amount > 0 ? goal.target_amount : 1
  const progressPercent = Math.round((currentValue / safeTarget) * 100)
  const projectedProgressPercent =
    projectedValue !== null ? Math.round((projectedValue / safeTarget) * 100) : null

  const dDay = targetDate ? diffDays(today, targetDate) : null
  const isCompleted = currentValue >= goal.target_amount

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

/**
 * 단일 목적의 진척도 계산.
 * - 현재값: 묶인 records의 평가액 합 + external_amount
 * - 예상값: target_date 시점 추정 (target_date NULL이면 null)
 * - 12% 연 수익률 cap 적용
 */
export function useGoalProgress(
  goal: Goal | null,
  records: Investment[],
): GoalProgress | null {
  return useMemo(() => {
    if (!goal) return null
    const linked = records.filter((r) => r.goal_id === goal.id)
    return calculateGoalProgress(goal, linked)
  }, [goal, records])
}

/**
 * 여러 목적의 진척도를 한 번에 계산 (홈 카드 캐러셀용).
 */
export function useGoalsProgress(
  goals: Goal[],
  records: Investment[],
): Map<string, GoalProgress> {
  return useMemo(() => {
    const map = new Map<string, GoalProgress>()
    for (const goal of goals) {
      const linked = records.filter((r) => r.goal_id === goal.id)
      map.set(goal.id, calculateGoalProgress(goal, linked))
    }
    return map
  }, [goals, records])
}
