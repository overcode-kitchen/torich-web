'use client'

import { useCallback, useState } from 'react'

/** 온보딩은 한 스텝에 질문 하나다(요소 예산: 온보딩 스텝 = 블록 1 · 숫자 1). */
export type V2OnboardingStep = 'branch' | 'balance' | 'plan'

/**
 * 갈라지는 것은 온보딩뿐이다(브리프 §4).
 * A(이미 모으는 사람)만 시작 잔액을 거치고, B는 계획으로 바로 간다.
 */
export function useV2Onboarding() {
  const [step, setStep] = useState<V2OnboardingStep>('branch')
  const [isExisting, setIsExisting] = useState(false)
  const [startBalance, setStartBalance] = useState(0)
  const [monthlyPlan, setMonthlyPlan] = useState(0)
  const [payday, setPayday] = useState(25)

  const chooseExisting = useCallback(() => {
    setIsExisting(true)
    setStep('balance')
  }, [])

  const chooseNew = useCallback(() => {
    setIsExisting(false)
    setStartBalance(0)
    setStep('plan')
  }, [])

  const back = useCallback(() => {
    setStep((s) => (s === 'plan' && isExisting ? 'balance' : 'branch'))
  }, [isExisting])

  return {
    step,
    isExisting,
    startBalance,
    monthlyPlan,
    payday,
    setStartBalance,
    setMonthlyPlan,
    setPayday,
    chooseExisting,
    chooseNew,
    goToPlan: useCallback(() => setStep('plan'), []),
    back,
  }
}
