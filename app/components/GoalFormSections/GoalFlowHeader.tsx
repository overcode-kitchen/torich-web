'use client'

import type { GoalStepId } from '@/app/hooks/goal/add/useGoalFlow'
import StepProgressBar from '@/app/components/Common/StepProgressBar'

interface GoalFlowHeaderProps {
  currentStep: GoalStepId
}

const STEP_ORDER: GoalStepId[] = ['A', 'B', 'C']

/**
 * /goal/new 3분할 프로그레스 바. 공용 StepProgressBar를 사용한다.
 */
export default function GoalFlowHeader({ currentStep }: GoalFlowHeaderProps) {
  return (
    <StepProgressBar
      current={STEP_ORDER.indexOf(currentStep) + 1}
      total={STEP_ORDER.length}
      className="w-32 mx-auto gap-1.5"
    />
  )
}
