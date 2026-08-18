'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { track } from '@/app/lib/analytics'

/**
 * 이번 세션에 사용자가 직접 풀어둔 상태. 모듈 스코프에 두어 탭을 오가며 컴포넌트가 다시 마운트돼도
 * 유지되고, 새로고침·앱 재시작이면 사라진다(= '세션 한정'의 실체).
 */
let sessionRevealed = false

export interface AmountVisibility {
  /** 금액을 그대로 보여줘도 되는지 */
  amountsVisible: boolean
  /** 가리기 설정이 켜져 있어 보기/가리기 버튼을 띄워야 하는지 */
  canToggle: boolean
  toggle: () => void
}

/**
 * 통계 '모은 돈' 탭의 금액 노출 정책.
 *
 * 가리기는 화면별 설정이 아니라 사용자 의도 하나다 — 홈에서 금액을 가려둔 사람에게 통계가 더 많이
 * 보여주면 가린 의미가 없다. 그래서 홈과 같은 `user_settings.show_monthly_amount`를 읽어 기본값을
 * 정하고, 이 탭 헤더의 '보기'는 **이 세션에만** 풀어준다(저장하지 않음 → 홈 설정은 그대로).
 * 새 컬럼을 만들지 않은 이유이기도 하다. 같은 관심사를 두 곳에 저장하면 둘이 어긋난다.
 *
 * 가려도 탭이 무의미해지지 않는 건 가리는 대상이 '금액'뿐이기 때문이다 —
 * 곡선의 모양, 도넛의 비중, 적립 횟수는 가려도 그대로 읽힌다.
 */
export function useAmountVisibility(): AmountVisibility {
  const { user } = useAuth()
  // 설정을 읽기 전에는 가린 쪽으로 기운다 — 잘못 가리는 건 불편이지만, 잘못 보여주는 건 정보 노출이다.
  const [hiddenBySetting, setHiddenBySetting] = useState(true)
  // 설정이 확정되기 전에 '보기' 버튼이 나타났다 사라지는 깜빡임을 막는다.
  const [settingResolved, setSettingResolved] = useState(false)
  const [revealed, setRevealed] = useState(sessionRevealed)

  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let alive = true

    const fetchSetting = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_settings')
        .select('show_monthly_amount')
        .eq('user_id', userId)
        .single()

      if (!alive) return

      // 행 없음(PGRST116 = 가린 적이 없는 신규 유저)만 '보임'으로 확정한다.
      // 그 외 조회 실패는 가린 상태를 유지한다 — 실패를 노출로 폴백하면 가려둔 사용자의 금액이
      // 그 세션 내내 드러난다. 홈이 같은 조회에서 이미 실패를 토스트로 알리므로 여기선 알리지 않고,
      // 대신 '보기'로 사용자가 직접 풀 수 있게 확정 처리만 한다.
      if (error) {
        setHiddenBySetting(error.code !== 'PGRST116')
        setSettingResolved(true)
        return
      }
      setHiddenBySetting(data?.show_monthly_amount === false)
      setSettingResolved(true)
    }

    void fetchSetting()
    return () => {
      alive = false
    }
  }, [userId])

  const toggle = useCallback(() => {
    setRevealed((prev) => {
      const next = !prev
      sessionRevealed = next
      track('stats_amount_reveal', { revealed: next })
      return next
    })
  }, [])

  return {
    amountsVisible: !hiddenBySetting || revealed,
    canToggle: settingResolved && hiddenBySetting,
    toggle,
  }
}
