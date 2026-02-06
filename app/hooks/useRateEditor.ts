'use client'

import { useCallback, useState } from 'react'

export interface UseRateEditorReturn {
  isRateEditing: boolean
  editingRate: string
  startEditing: (currentRate: number) => void
  confirmEdit: (onConfirm: (newRate: number) => void) => void
  cancelEdit: () => void
  handleRateChange: (value: string) => void
}

export function useRateEditor(): UseRateEditorReturn {
  const [isRateEditing, setIsRateEditing] = useState<boolean>(false)
  const [editingRate, setEditingRate] = useState<string>('')

  const startEditing = useCallback((currentRate: number): void => {
    setEditingRate(String(currentRate))
    setIsRateEditing(true)
  }, [])

  const confirmEdit = useCallback(
    (onConfirm: (newRate: number) => void): void => {
      const newRate: number = parseFloat(editingRate)
      if (!Number.isNaN(newRate) && newRate > 0) {
        onConfirm(newRate)
      }
      setIsRateEditing(false)
    },
    [editingRate],
  )

  const cancelEdit = useCallback((): void => {
    setIsRateEditing(false)
    setEditingRate('')
  }, [])

  const handleRateChange = useCallback((inputValue: string): void => {
    const value: string = inputValue.replace(/[^0-9.]/g, '')
    const parts: string[] = value.split('.')
    if (parts.length <= 2) {
      setEditingRate(value)
    }
  }, [])

  return {
    isRateEditing,
    editingRate,
    startEditing,
    confirmEdit,
    cancelEdit,
    handleRateChange,
  }
}
