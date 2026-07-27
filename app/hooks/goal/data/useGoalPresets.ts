'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  GOAL_PRESETS,
  resolvePurposeIcon,
  type GoalPreset,
} from '@/app/constants/goal'

/**
 * 목적 추천 칩(프리셋)을 Supabase `goal_presets`에서 원격 조회한다 (#75).
 *
 * 설계 원칙:
 * - **폴백 우선**: 초기값은 앱 내장 `GOAL_PRESETS` 상수. 조회 실패·빈 결과·구버전 DB(테이블 없음)이면
 *   상수를 그대로 유지한다(동작 변화 0). 로딩 중 빈 화면 깜빡임도 없다.
 * - **아이콘은 앱 내장 유지**: 원격 `icon_key`가 앱에 없는 값이면(=이미지 없음) 그 항목을 버린다.
 *   이미지 자체 원격화는 이번 범위 밖이므로, 알 수 없는 아이콘은 폴백 처리한다.
 * - **기간 노출**: `display_from`/`display_to` 창 밖 항목은 클라이언트에서 걸러낸다(NULL이면 상시).
 */
export function useGoalPresets(): { presets: GoalPreset[] } {
  const supabase = useMemo(() => createClient(), [])
  const [presets, setPresets] = useState<GoalPreset[]>(GOAL_PRESETS)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('goal_presets')
          .select('name, icon_key, sort_order, display_from, display_to')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        if (error) throw error

        const now = Date.now()
        const remote: GoalPreset[] = (data ?? [])
          .filter((row) => {
            const from = row.display_from ? Date.parse(row.display_from) : null
            const to = row.display_to ? Date.parse(row.display_to) : null
            if (from !== null && now < from) return false
            if (to !== null && now > to) return false
            // 앱에 없는 icon_key는 렌더할 이미지가 없으므로 제외(폴백).
            return resolvePurposeIcon(row.icon_key) !== null
          })
          .map((row) => ({ name: row.name, iconKey: row.icon_key }))

        // 유효한 원격 프리셋이 하나도 없으면 상수 폴백을 유지한다.
        if (!cancelled && remote.length > 0) {
          setPresets(remote)
        }
      } catch (e) {
        // 조회 실패 시 상수 폴백 유지(구버전 DB·네트워크 오류 포함).
        console.error('useGoalPresets fetch failed:', e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [supabase])

  return { presets }
}
