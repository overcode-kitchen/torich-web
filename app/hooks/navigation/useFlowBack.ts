'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseFlowBackOptions {
  /**
   * 이 플로우의 루트 경로 (예: '/', '/settings')
   */
  rootPath: string
  /**
   * 브라우저 히스토리를 사용할지 여부
   * - true: 같은 오리진에서 온 히스토리가 있으면 back(), 아니면 루트로 이동
   * - false: 항상 루트로 이동
   */
  enableHistoryFallback?: boolean
}

/**
 * "이 화면을 끝내고 들어온 자리로 돌아간다"를 담당하는 단 하나의 규칙.
 *
 * ← 버튼뿐 아니라 **저장 성공 후 복귀도 반드시 이걸 쓴다.** 저장 후에 `push`/`replace`로
 * 복귀 화면을 새로 얹으면 히스토리에 진입 화면이 한 번 더 쌓이거나 수정 화면이 그대로
 * 남아, 복귀한 화면의 ←가 방금 나온 수정 화면을 다시 연다. 되감기(`back`)만이
 * 진입 전 히스토리를 그대로 복원한다.
 *
 * 앱 밖에서 곧장 들어온 경우(딥링크 등)에만 되감을 자리가 없으므로 `rootPath`로 폴백한다.
 */
export function useFlowBack({ rootPath, enableHistoryFallback = true }: UseFlowBackOptions) {
  const router = useRouter()

  const goBack = useCallback(() => {
    if (typeof window === 'undefined') {
      router.replace(rootPath)
      return
    }

    const { history, location, document } = window

    const hasHistory = history.length > 1
    // SPA(router.push) 이동은 document.referrer를 갱신하지 않고,
    // Capacitor 앱에선 referrer가 빈 문자열이라 'sameOrigin' 검사로는 SPA 진입을 잡지 못한다.
    // 외부 사이트에서 들어온 경우만 차단하고, 그 외(빈 referrer 포함)는 history로 판단한다.
    const externalReferrer =
      !!document.referrer && !document.referrer.startsWith(location.origin)

    if (enableHistoryFallback && hasHistory && !externalReferrer) {
      router.back()
    } else {
      router.replace(rootPath)
    }
  }, [router, rootPath, enableHistoryFallback])

  return { goBack }
}

