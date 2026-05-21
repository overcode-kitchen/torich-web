'use client'

import { useEffect, useState } from 'react'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import { createClient } from '@/utils/supabase/client'
import type { Investment } from '@/app/types/investment'

export interface UseAddItemEditInitProps {
  /** URL searchParams의 editId. 없으면 신규 추가 모드. */
  editId?: string | null
}

export interface UseAddItemEditInitReturn {
  /** 편집 대상 레코드. null = 로딩 중 또는 신규 추가. */
  initData: Investment | null
  isLoading: boolean
  error: string | null
}

/**
 * 편집 모드에서 기존 record를 가져와 초기 데이터로 노출하는 hook.
 * - InvestmentsContext의 캐시(records)에서 우선 탐색 → 네트워크 비용 0
 * - 캐시 미스 시 Supabase에서 직접 fetch (캐시가 아직 로딩 중이거나 다른 사용자 진입 시)
 * - editId가 없으면 신규 추가 모드 — initData=null로 무동작
 */
export function useAddItemEditInit({
  editId,
}: UseAddItemEditInitProps): UseAddItemEditInitReturn {
  const { records } = useInvestmentsContext()
  const [initData, setInitData] = useState<Investment | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editId) {
      setInitData(null)
      setIsLoading(false)
      setError(null)
      return
    }

    // 1) 캐시 hit
    const cached = records.find((r) => r.id === editId) ?? null
    if (cached) {
      setInitData(cached)
      setIsLoading(false)
      setError(null)
      return
    }

    // 2) 캐시 miss → Supabase 직접 fetch
    let cancelled = false
    setIsLoading(true)
    setError(null)
    void (async () => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('records')
          .select('*')
          .eq('id', editId)
          .single<Investment>()
        if (cancelled) return
        if (fetchError || !data) {
          setError('편집할 항목을 찾지 못했어요.')
          setInitData(null)
        } else {
          setInitData(data)
        }
      } catch {
        if (cancelled) return
        setError('편집할 항목을 불러오지 못했어요.')
        setInitData(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [editId, records])

  return { initData, isLoading, error }
}
