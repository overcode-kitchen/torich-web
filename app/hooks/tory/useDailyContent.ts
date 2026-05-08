'use client'

import { useEffect, useState } from 'react'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'

export interface RichQuote {
  id: number
  text: string
  author: string
}

export interface UseDailyContentReturn {
  richQuote: RichQuote | null
  isLoading: boolean
}

/**
 * 1월 1일 = 1을 반환하는 dayOfYear 계산.
 * 로컬 타임존 기준으로 날짜를 잘라낸 뒤 일수 차이를 구한다.
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const MS_PER_DAY = 86_400_000
  return Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY) + 1
}

/**
 * 토리가 골라준 오늘의 부자 명언을 반환한다.
 * - dayOfYear를 데이터 길이로 나눈 나머지로 인덱싱
 * - fetch 실패 시 toast 노출, 빈 상태로 폴백
 */
export function useDailyContent(): UseDailyContentReturn {
  const [richQuote, setRichQuote] = useState<RichQuote | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false

    const load = async (): Promise<void> => {
      try {
        const res = await fetch('/data/rich-quotes.json', { cache: 'force-cache' })
        if (!res.ok) {
          throw new Error('failed to fetch daily quote')
        }

        const quoteList = (await res.json()) as RichQuote[]
        if (cancelled) return

        if (quoteList.length > 0) {
          const dayOfYear = getDayOfYear(new Date())
          setRichQuote(quoteList[dayOfYear % quoteList.length])
        }
      } catch (error) {
        if (cancelled) return
        toastError(TOAST_MESSAGES.dataLoadFailed)
        console.error('[useDailyContent] load failed', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { richQuote, isLoading }
}
