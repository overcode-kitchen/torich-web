import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Investment, getStartDate } from '@/app/types/investment'
import { isCompleted } from '@/app/utils/date'

export interface UseStatsDataReturn {
  user: { id: string; email?: string } | null
  records: Investment[]
  activeRecords: Investment[]
  isLoading: boolean
  router: any
}

export function useStatsData(): UseStatsDataReturn {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [records, setRecords] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const { data } = await supabase
          .from('records')
          .select('*')
          .order('created_at', { ascending: false })
        setRecords(data || [])
      }
      setIsLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('records').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          setRecords(data || [])
        })
      } else {
        setRecords([])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const activeRecords = useMemo(() => {
    return records.filter((r) => {
      const start = getStartDate(r)
      return !isCompleted(start, r.period_years)
    })
  }, [records])

  return {
    user,
    records,
    activeRecords,
    isLoading,
    router,
  }
}
