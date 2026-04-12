'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { Investment, getStartDate } from '@/app/types/investment'
import { isCompleted } from '@/app/utils/date'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'

export interface UseStatsDataReturn {
  user: { id: string; email?: string } | null
  records: Investment[]
  activeRecords: Investment[]
  isLoading: boolean
  router: ReturnType<typeof useRouter>
}

export function useStatsData(): UseStatsDataReturn {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [records, setRecords] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (authLoading) return

    const uid = user?.id
    if (!uid) {
      setRecords([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('records')
          .select('*')
          .order('created_at', { ascending: false })

        if (cancelled) return
        if (error) throw error
        setRecords(data || [])
      } catch {
        toastError(TOAST_MESSAGES.statsLoadFailed)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [authLoading, user?.id, supabase])

  const activeRecords = useMemo(() => {
    return records.filter((r) => {
      const start = getStartDate(r)
      return !isCompleted(start, r.period_years)
    })
  }, [records])

  const slimUser = user
    ? { id: user.id, email: user.email ?? undefined }
    : null

  return {
    user: slimUser,
    records,
    activeRecords,
    isLoading,
    router,
  }
}
