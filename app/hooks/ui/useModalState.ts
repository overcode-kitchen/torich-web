'use client'

import { useState, useCallback } from 'react'

export interface UseModalStateReturn {
  isDatePickerOpen: boolean
  setIsDatePickerOpen: (open: boolean) => void
  isDaysPickerOpen: boolean
  setIsDaysPickerOpen: (open: boolean) => void
  isRateHelpModalOpen: boolean
  setIsRateHelpModalOpen: (open: boolean) => void
  closeAllModals: () => void
}

export function useModalState(): UseModalStateReturn {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false)
  const [isDaysPickerOpen, setIsDaysPickerOpen] = useState<boolean>(false)
  const [isRateHelpModalOpen, setIsRateHelpModalOpen] = useState<boolean>(false)

  const closeAllModals = useCallback((): void => {
    setIsDatePickerOpen(false)
    setIsDaysPickerOpen(false)
    setIsRateHelpModalOpen(false)
  }, [])

  return {
    isDatePickerOpen,
    setIsDatePickerOpen,
    isDaysPickerOpen,
    setIsDaysPickerOpen,
    isRateHelpModalOpen,
    setIsRateHelpModalOpen,
    closeAllModals,
  }
}
