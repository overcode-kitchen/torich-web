'use client'

import { useCallback, useState } from 'react'

type HandleManualConfirmCallbacks = {
  onConfirm: (name: string, rate: number) => void
}

/** 직접 입력 항목의 기본 연 수익률 (화면 노출 없음, DB 호환을 위한 기본값) */
const DEFAULT_MANUAL_RATE = 10

export interface UseManualInputReturn {
  isManualModalOpen: boolean
  setIsManualModalOpen: (open: boolean) => void

  manualStockName: string
  setManualStockName: (name: string) => void

  isManualInput: boolean
  setIsManualInput: (manual: boolean) => void

  handleManualConfirm: (callbacks: HandleManualConfirmCallbacks) => void
  closeAndReset: () => void
}

export function useManualInput(): UseManualInputReturn {
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false)
  const [manualStockName, setManualStockName] = useState<string>('')
  const [isManualInput, setIsManualInput] = useState<boolean>(false)

  const closeAndReset = useCallback((): void => {
    setIsManualModalOpen(false)
    setManualStockName('')
  }, [])

  const handleManualConfirm = useCallback(
    (callbacks: HandleManualConfirmCallbacks): void => {
      if (!manualStockName.trim()) {
        alert('종목 이름을 입력해주세요.')
        return
      }

      callbacks.onConfirm(manualStockName.trim(), DEFAULT_MANUAL_RATE)
      closeAndReset()
    },
    [closeAndReset, manualStockName],
  )

  return {
    isManualModalOpen,
    setIsManualModalOpen,
    manualStockName,
    setManualStockName,
    isManualInput,
    setIsManualInput,
    handleManualConfirm,
    closeAndReset,
  }
}
