'use client'

import { useCallback, useState } from 'react'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'

export interface UseInvestmentGoalLinkReturn {
  linkRecordToGoal: (recordId: string, goalId: string | null) => Promise<void>
  isLinking: boolean
}

/**
 * 적립 항목 하나를 목적에 묶거나(goalId) 푼다(null).
 *
 * 반드시 `InvestmentsContext`의 `updateInvestment`를 거친다. 예전에는 여기서
 * supabase를 직접 호출해 DB만 바꿨고, 그 결과 메인·통계·캘린더가 읽는 context는
 * 옛 `goal_id`를 그대로 들고 있었다 (#162). `goal_id`는 UPDATABLE_COLUMNS에
 * 있으므로 DB와 로컬 상태가 함께 갱신된다.
 */
export function useInvestmentGoalLink(): UseInvestmentGoalLinkReturn {
  const { updateInvestment } = useInvestmentsContext()
  const [isLinking, setIsLinking] = useState<boolean>(false)

  const linkRecordToGoal = useCallback(
    async (recordId: string, goalId: string | null): Promise<void> => {
      setIsLinking(true)
      try {
        await updateInvestment(recordId, { goal_id: goalId })
      } catch (e) {
        console.error('linkRecordToGoal failed:', e)
        throw e
      } finally {
        setIsLinking(false)
      }
    },
    [updateInvestment],
  )

  return { linkRecordToGoal, isLinking }
}
