'use client'

import { useState, useEffect } from 'react'
import type { Investment } from '@/app/types/investment'

interface UseHomePageUIProps {
  userId?: string
  records: Investment[]
  checkAndUpdate: () => Promise<boolean>
  refetch: () => void
}

export function useHomePageUI({ userId, records, checkAndUpdate, refetch }: UseHomePageUIProps) {
  const [detailItem, setDetailItem] = useState<Investment | null>(null)
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState<boolean>(false)
  const [showBrandStoryCard, setShowBrandStoryCard] = useState<boolean>(true)

  useEffect((): void => {
    if (!userId || records.length === 0) return
    void checkAndUpdate().then((updated: boolean) => {
      if (updated) void refetch()
    })
  }, [userId, records.length, checkAndUpdate, refetch])

  return {
    detailItem,
    setDetailItem,
    isBrandStoryOpen,
    setIsBrandStoryOpen,
    showBrandStoryCard,
    setShowBrandStoryCard
  }
}
