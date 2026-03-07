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

export function useFlowBack({ rootPath, enableHistoryFallback = true }: UseFlowBackOptions) {
  const router = useRouter()

  const goBack = useCallback(() => {
    if (typeof window === 'undefined') {
      router.replace(rootPath)
      return
    }

    const { history, location, document } = window

    const hasHistory = history.length > 1
    const sameOriginReferrer =
      document.referrer && document.referrer.startsWith(location.origin)

    if (enableHistoryFallback && hasHistory && sameOriginReferrer) {
      router.back()
    } else {
      router.replace(rootPath)
    }
  }, [router, rootPath, enableHistoryFallback])

  return { goBack }
}

