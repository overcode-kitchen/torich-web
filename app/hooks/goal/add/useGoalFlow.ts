'use client'

import { useCallback, useState } from 'react'

export type GoalStepId = 'A' | 'B' | 'C'

const STEP_ORDER: GoalStepId[] = ['A', 'B', 'C']

export interface UseGoalFlowReturn {
  currentStep: GoalStepId
  isAtFirstStep: boolean
  isAtLastStep: boolean
  goNextStep: () => void
  goPrevStep: () => void
}

/**
 * /goal/new 단계 플로우 (A: 이름 → B: 금액 → C: 마감일) state hook.
 * /add의 useAddItemFlow와 동일한 패턴이지만 필드 기반 진입 매핑이 없다.
 * 단계 전환 시 iOS 키보드 잔류 방지를 위해 activeElement.blur() 호출.
 */
export function useGoalFlow(): UseGoalFlowReturn {
  const [currentStep, setCurrentStep] = useState<GoalStepId>('A')

  const dismissKeyboard = useCallback((): void => {
    if (
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur()
    }
  }, [])

  const goNextStep = useCallback((): void => {
    dismissKeyboard()
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx < STEP_ORDER.length - 1) setCurrentStep(STEP_ORDER[idx + 1])
  }, [currentStep, dismissKeyboard])

  const goPrevStep = useCallback((): void => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx > 0) setCurrentStep(STEP_ORDER[idx - 1])
  }, [currentStep])

  return {
    currentStep,
    isAtFirstStep: currentStep === 'A',
    isAtLastStep: currentStep === 'C',
    goNextStep,
    goPrevStep,
  }
}
