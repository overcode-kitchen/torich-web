'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * 온보딩을 마치지 않았으면 온보딩으로 보낸다.
 * 저장값을 읽기 전(`ready === false`)에는 판단하지 않는다 — 안 그러면 새로고침마다 튕긴다.
 */
export function useV2Gate(ready: boolean, onboarded: boolean) {
  const router = useRouter()

  useEffect(() => {
    if (ready && !onboarded) router.replace('/v2/onboarding')
  }, [ready, onboarded, router])
}
