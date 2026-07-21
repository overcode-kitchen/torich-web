'use client'

import { useState } from 'react'

export interface UseStatsPageUIProps {
  recordsLength: number
}

export interface UseStatsPageUIReturn {
  showContributionSheet: boolean
  hasRecords: boolean
  handleShowContribution: () => void
  handleCloseContribution: () => void
}

export function useStatsPageUI({ recordsLength }: UseStatsPageUIProps): UseStatsPageUIReturn {
  const [showContributionSheet, setShowContributionSheet] = useState(false)

  const handleShowContribution = () => setShowContributionSheet(true)
  const handleCloseContribution = () => setShowContributionSheet(false)

  const hasRecords = recordsLength > 0

  return {
    showContributionSheet,
    hasRecords,
    handleShowContribution,
    handleCloseContribution,
  }
}
