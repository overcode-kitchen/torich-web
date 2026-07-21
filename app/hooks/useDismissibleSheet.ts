'use client'

import { useCallback, useState } from 'react'

/**
 * 바텀시트의 진입/퇴장 애니메이션을 일관되게 처리한다.
 * 닫기 요청 시 즉시 언마운트하지 않고, 퇴장 애니메이션이 끝난 뒤 onClose를 호출한다.
 */
export function useDismissibleSheet(onClose: () => void) {
  const [isClosing, setIsClosing] = useState(false)

  // 닫기 요청 — 퇴장 애니메이션을 시작한다
  const requestClose = useCallback(() => setIsClosing(true), [])

  // 시트 요소의 애니메이션이 끝나면 호출 — 퇴장 애니메이션일 때만 실제 언마운트
  const onAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      // 자식 요소(월 그리드 등)의 애니메이션 버블링은 무시하고 시트 자신만 처리
      if (e.target !== e.currentTarget) return
      if (isClosing) onClose()
    },
    [isClosing, onClose],
  )

  return { isClosing, requestClose, onAnimationEnd }
}
