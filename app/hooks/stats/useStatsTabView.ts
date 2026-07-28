'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { track } from '@/app/lib/analytics'

export const STATS_VIEWS = ['goal', 'record', 'money'] as const
export type StatsView = (typeof STATS_VIEWS)[number]

function isStatsView(value: string | null): value is StatsView {
  return value !== null && (STATS_VIEWS as readonly string[]).includes(value)
}

/**
 * 통계 탭의 세그먼트 상태를 URL query로 관리한다 (`/stats?view=goal|record|money`).
 *
 * - 정적 export(`output: 'export'`)라 `[param]` 동적 세그먼트를 쓸 수 없어 query param으로 둔다.
 * - push로 쌓아 뒤로가기가 '이전 탭'으로 돌아오게 한다. 통계는 루트 탭이라 화면 내 back 버튼이
 *   없고(iOS 하드웨어 back도 없음) 히스토리가 쌓여도 탈출을 막지 않는다.
 * - 알 수 없는 값이 오면 fallback으로 떨어뜨린다(URL은 고치지 않는다 — 사용자가 탭을 누르는
 *   순간부터 정상 값으로 덮인다).
 *
 * @param fallback view 파라미터가 없거나 잘못됐을 때 쓸 탭
 */
export function useStatsTabView(fallback: StatsView) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const raw = searchParams.get('view')
  const view: StatsView = isStatsView(raw) ? raw : fallback

  const setView = useCallback(
    (next: StatsView) => {
      if (next === view) return
      track('stats_tab_change', { view: next })
      // scroll: false — 탭만 바뀌는데 스크롤이 맨 위로 튀지 않게
      router.push(`/stats?view=${next}`, { scroll: false })
    },
    [router, view],
  )

  return { view, setView }
}
