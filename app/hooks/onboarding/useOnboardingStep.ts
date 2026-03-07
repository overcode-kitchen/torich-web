'use client'

import { useCallback, useState } from 'react'

const TOTAL_STEPS = 3

export function useOnboardingStep() {
  const [step, setStep] = useState(1)

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  }, [])

  const goPrev = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const goToStep = useCallback((stepNumber: number) => {
    setStep((prev) => Math.max(1, Math.min(stepNumber, TOTAL_STEPS)))
  }, [])

  const isFirst = step === 1
  const isLast = step === TOTAL_STEPS

  return {
    step,
    totalSteps: TOTAL_STEPS,
    goNext,
    goPrev,
    goToStep,
    isFirst,
    isLast,
  }
}
