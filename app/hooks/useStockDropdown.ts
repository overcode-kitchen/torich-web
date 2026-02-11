'use client'

import { useCallback, useEffect, useState } from 'react'

export interface UseStockDropdownReturn {
  showDropdown: boolean
  setShowDropdown: (show: boolean) => void
}

export function useStockDropdown(): UseStockDropdownReturn {
  const [showDropdown, setShowDropdown] = useState<boolean>(false)

  useEffect((): (() => void) => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target: HTMLElement | null = event.target instanceof HTMLElement ? event.target : null
      if (!target) return
      if (target.closest('.stock-search-container')) return
      setShowDropdown(false)
    }

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
    }

    return (): void => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  return {
    showDropdown,
    setShowDropdown,
  }
}
