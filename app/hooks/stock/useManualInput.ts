'use client'

import { useCallback, useState } from 'react'

type HandleManualConfirmCallbacks = {
  onConfirm: (name: string, rate: number) => void
}

export interface UseManualInputReturn {
  isManualModalOpen: boolean
  setIsManualModalOpen: (open: boolean) => void

  manualStockName: string
  setManualStockName: (name: string) => void
  manualRate: string
  setManualRate: (rate: string) => void

  isManualInput: boolean
  setIsManualInput: (manual: boolean) => void

  handleManualConfirm: (callbacks: HandleManualConfirmCallbacks) => void
  closeAndReset: () => void
}

export function useManualInput(): UseManualInputReturn {
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false)
  const [manualStockName, setManualStockName] = useState<string>('')
  const [manualRate, setManualRate] = useState<string>('')
  const [isManualInput, setIsManualInput] = useState<boolean>(false)

  const closeAndReset = useCallback((): void => {
    setIsManualModalOpen(false)
    setManualStockName('')
    setManualRate('')
  }, [])

  const handleManualConfirm = useCallback(
    (callbacks: HandleManualConfirmCallbacks): void => {
      if (!manualStockName.trim()) {
        alert('종목 이름을 입력해주세요.')
        return
      }

      const parsedRate: number = parseFloat(manualRate)
      if (!manualRate || Number.isNaN(parsedRate) || parsedRate <= 0) {
        alert('예상 수익률을 입력해주세요.')
        return
      }

      callbacks.onConfirm(manualStockName.trim(), parsedRate)
      closeAndReset()
    },
    [closeAndReset, manualRate, manualStockName],
  )

  return {
    isManualModalOpen,
    setIsManualModalOpen,
    manualStockName,
    setManualStockName,
    manualRate,
    setManualRate,
    isManualInput,
    setIsManualInput,
    handleManualConfirm,
    closeAndReset,
  }
}
