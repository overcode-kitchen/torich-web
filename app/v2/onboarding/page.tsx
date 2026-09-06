'use client'

import { useRouter } from 'next/navigation'
import { useV2Sandbox } from '@/app/hooks/v2/useV2Sandbox'
import { useV2Onboarding } from '@/app/hooks/v2/useV2Onboarding'
import V2OnboardingView from '@/app/components/V2Sections/V2OnboardingView'

export default function V2OnboardingPage() {
  const router = useRouter()
  const { completeOnboarding } = useV2Sandbox()
  const onboarding = useV2Onboarding()

  const complete = () => {
    completeOnboarding({
      startBalance: onboarding.startBalance,
      monthlyPlan: onboarding.monthlyPlan,
      payday: onboarding.payday,
    })
    router.replace('/v2')
  }

  return (
    <V2OnboardingView
      step={onboarding.step}
      startBalance={onboarding.startBalance}
      monthlyPlan={onboarding.monthlyPlan}
      payday={onboarding.payday}
      onBack={onboarding.back}
      onChooseExisting={onboarding.chooseExisting}
      onChooseNew={onboarding.chooseNew}
      onStartBalanceChange={onboarding.setStartBalance}
      onMonthlyPlanChange={onboarding.setMonthlyPlan}
      onPaydayChange={onboarding.setPayday}
      onGoToPlan={onboarding.goToPlan}
      onComplete={complete}
    />
  )
}
