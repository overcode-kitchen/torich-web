'use client'

import { useCallback, useState } from 'react'
import type { Goal, GoalCreateInput } from '@/app/types/goal'

export interface GoalFormValues {
  name: string
  target_amount: string
  target_date: string
  emoji: string
  memo: string
  external_amount: string
  notification_enabled: boolean
}

const EMPTY: GoalFormValues = {
  name: '',
  target_amount: '',
  target_date: '',
  emoji: '',
  memo: '',
  external_amount: '0',
  notification_enabled: true,
}

function fromGoal(goal: Goal): GoalFormValues {
  return {
    name: goal.name,
    target_amount: String(goal.target_amount),
    target_date: goal.target_date ?? '',
    emoji: goal.emoji ?? '',
    memo: goal.memo ?? '',
    external_amount: String(goal.external_amount ?? 0),
    notification_enabled: goal.notification_enabled,
  }
}

function toCreateInput(values: GoalFormValues): GoalCreateInput {
  return {
    name: values.name.trim(),
    target_amount: Number(values.target_amount),
    target_date: values.target_date.trim() || null,
    emoji: values.emoji.trim() || null,
    memo: values.memo.trim() || null,
    external_amount: Number(values.external_amount) || 0,
    notification_enabled: values.notification_enabled,
  }
}

export interface UseGoalFormReturn {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) => void
  reset: () => void
  isValid: boolean
  toCreateInput: () => GoalCreateInput
}

export function useGoalForm(initial?: Goal | null): UseGoalFormReturn {
  const [values, setValues] = useState<GoalFormValues>(
    initial ? fromGoal(initial) : EMPTY,
  )

  const setField = useCallback(
    <K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]): void => {
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const reset = useCallback((): void => setValues(EMPTY), [])

  const isValid = values.name.trim().length > 0 && Number(values.target_amount) > 0

  return {
    values,
    setField,
    reset,
    isValid,
    toCreateInput: (): GoalCreateInput => toCreateInput(values),
  }
}
