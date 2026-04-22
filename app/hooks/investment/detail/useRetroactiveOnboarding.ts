'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'

interface UseRetroactiveOnboardingParams {
  retroactivePaymentHistory: Array<{ yearMonth: string }> | undefined
}

/**
 * /investment?id=...&retroHint=1 로 진입했을 때,
 * 소급 구간이 실제로 존재하면 안내 Sheet를 자동 노출한다.
 */
export function useRetroactiveOnboarding({
  retroactivePaymentHistory,
}: UseRetroactiveOnboardingParams) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleTabClick } = useInvestmentTabContext()

  const hintParam = searchParams.get('retroHint')
  const hasHint = hintParam === '1'
  const hasRetro = (retroactivePaymentHistory?.length ?? 0) > 0

  const [dismissed, setDismissed] = useState(false)
  const isOpen = hasHint && hasRetro && !dismissed

  // hint 쿼리는 소비 후 URL에서 정리한다 (히스토리 back 시 재노출 방지)
  const consumeHintParam = useCallback(() => {
    if (!hasHint) return
    const next = new URLSearchParams(Array.from(searchParams.entries()))
    next.delete('retroHint')
    const query = next.toString()
    const url = query ? `/investment?${query}` : '/investment'
    router.replace(url)
  }, [hasHint, router, searchParams])

  const onRecordNow = useCallback(() => {
    setDismissed(true)
    handleTabClick('history')
    consumeHintParam()
  }, [handleTabClick, consumeHintParam])

  const onLater = useCallback(() => {
    setDismissed(true)
    consumeHintParam()
  }, [consumeHintParam])

  const { rangeStart, rangeEnd, monthsCount } = useMemo(() => {
    const list = retroactivePaymentHistory ?? []
    if (list.length === 0) {
      return { rangeStart: '', rangeEnd: '', monthsCount: 0 }
    }
    // retroactivePaymentHistory는 최신순 → 마지막이 가장 오래된 월
    const newest = list[0].yearMonth.replace('-', '.')
    const oldest = list[list.length - 1].yearMonth.replace('-', '.')
    return { rangeStart: oldest, rangeEnd: newest, monthsCount: list.length }
  }, [retroactivePaymentHistory])

  // hint가 있었지만 소급 구간이 없으면 URL만 정리
  useEffect(() => {
    if (hasHint && !hasRetro) {
      consumeHintParam()
    }
  }, [hasHint, hasRetro, consumeHintParam])

  return {
    isOpen,
    rangeStart,
    rangeEnd,
    monthsCount,
    onRecordNow,
    onLater,
  }
}
