'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export interface UseUserDataReturn {
  userId: string | null
}

export function useUserData(): UseUserDataReturn {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async (): Promise<void> => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserId(data.user.id)
      } else {
        router.push('/login')
      }
    }

    void getUser()
  }, [router])

  return {
    userId,
  }
}
