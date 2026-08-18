'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import type { Goal } from '@/app/types/goal'
import type { Investment } from '@/app/types/investment'

export interface UseGoalDetailReturn {
  goal: Goal | null
  records: Investment[]
  unlinkedRecords: Investment[]
  isLoading: boolean
  setGoal: React.Dispatch<React.SetStateAction<Goal | null>>
}

/**
 * 목적 detail 페이지용 데이터.
 * - goal 1건: 이 훅이 직접 조회한다.
 * - records / unlinkedRecords: **직접 조회하지 않고 `InvestmentsContext`에서 파생**한다.
 *
 * 예전에는 records도 여기서 따로 조회했다. 그래서 상세에서 묶기/풀기를 하면
 * 이 화면만 갱신되고, 같은 데이터를 쓰는 메인·통계·캘린더는 옛 `goal_id`를 계속
 * 들고 있었다 (#162). 적립 항목의 단일 진실 출처는 context 하나로 둔다.
 *
 * userId는 인자로 받지 않고 `useAuth`에서 직접 읽는다. 호출하는 화면들이 `getUser()`로
 * 다시 받아오던 구조에서는 인증이 오기 전 구간이 '유저 없음'과 구분되지 않아,
 * 존재하는 목적에 "찾을 수 없습니다"가 스쳤다 (#177).
 */
export function useGoalDetail(id: string | undefined): UseGoalDetailReturn {
  const supabase = useMemo(() => createClient(), [])
  const { user, isLoading: isAuthLoading } = useAuth()
  const userId = user?.id
  const { records: allRecords, isLoading: isRecordsLoading } = useInvestmentsContext()
  const [goal, setGoal] = useState<Goal | null>(null)
  /** 조회를 끝낸 goal id. 별도 loading 플래그 없이 로딩 여부를 여기서 파생한다. */
  const [loadedId, setLoadedId] = useState<string | null>(null)

  /** 조회만 하고 상태는 건드리지 않는다. 결과를 어디에 반영할지는 호출한 쪽이 정한다. */
  const fetchGoal = useCallback(async (): Promise<Goal | null> => {
    if (!id || !userId) return null
    try {
      const goalRes = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
      if (goalRes.error) throw goalRes.error
      return goalRes.data as Goal
    } catch (e) {
      console.error('useGoalDetail fetch failed:', e)
      return null
    }
  }, [supabase, id, userId])

  useEffect(() => {
    // 인증이 확정되기 전에는 조회하지 않는다. 여기서 조회하면 userId가 없어 무조건 null이 나오고,
    // 그 null이 '없음'으로 확정돼 존재하는 목적에 에러 화면이 뜬다.
    // 확정된 뒤 유저가 없으면(로그아웃) 조회는 null을 반환하고 loadedId가 채워져
    // 에러 화면 + [홈으로]로 빠져나갈 수 있다 — 무한 스피너에 갇히지 않는다.
    if (isAuthLoading) return

    let cancelled = false
    void (async () => {
      const row = await fetchGoal()
      // id가 바뀐 뒤 늦게 도착한 응답으로 남의 목적을 그리지 않는다.
      if (cancelled) return
      setGoal(row)
      setLoadedId(id ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchGoal, id, isAuthLoading])

  const records = useMemo(
    (): Investment[] => allRecords.filter((r) => r.goal_id === id),
    [allRecords, id],
  )
  /** goal_id가 비어 있는 항목 = 이 목적에 새로 묶을 수 있는 후보 */
  const unlinkedRecords = useMemo(
    (): Investment[] => allRecords.filter((r) => !r.goal_id),
    [allRecords],
  )

  // id가 있는데 아직 그 id를 조회하지 못했다면 로딩이다. 인증이 늦게 확정되는 구간도
  // 여기에 포함되어, 데이터가 오기 전에 "찾을 수 없음"이 스치지 않는다.
  const isGoalLoading = isAuthLoading || (id !== undefined && loadedId !== id)

  return {
    goal,
    records,
    unlinkedRecords,
    isLoading: isGoalLoading || isRecordsLoading,
    setGoal,
  }
}
