'use client'

import { useState } from 'react'

export interface UseStatsPageUIProps {
  recordsLength: number
}

export interface UseStatsPageUIReturn {
  selectedYear: number
  showCashHoldSheet: boolean
  showContributionSheet: boolean
  hasRecords: boolean
  setSelectedYear: (year: number) => void
  handleShowCashHold: () => void
  handleCloseCashHold: () => void
  handleShowContribution: () => void
  handleCloseContribution: () => void
}

export function useStatsPageUI({ recordsLength }: UseStatsPageUIProps): UseStatsPageUIReturn {
  const [selectedYear, setSelectedYear] = useState(5)
  const [showCashHoldSheet, setShowCashHoldSheet] = useState(false)
  const [showContributionSheet, setShowContributionSheet] = useState(false)

  const handleShowCashHold = () => setShowCashHoldSheet(true)
  const handleCloseCashHold = () => setShowCashHoldSheet(false)

  const handleShowContribution = () => setShowContributionSheet(true)
  const handleCloseContribution = () => setShowContributionSheet(false)

  const hasRecords = recordsLength > 0

  return {
    // 상태
    selectedYear,
    showCashHoldSheet,
    showContributionSheet,
    hasRecords,

    // 상태 변경 함수
    setSelectedYear,

    // 이벤트 핸들러
    handleShowCashHold,
    handleCloseCashHold,
    handleShowContribution,
    handleCloseContribution,
  }
}
