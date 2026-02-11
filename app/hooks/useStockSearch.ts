'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Market } from './types/useStockSearch'
import { useStockSearchQuery } from './useStockSearchQuery'
import { useStockRate } from './useStockRate'
import { useStockDropdown } from './useStockDropdown'
import type { UseStockSearchReturn, SearchResult, StockDetail } from './types/useStockSearch'

export function useStockSearch(stockName: string, isManualInput: boolean): UseStockSearchReturn {
  const [selectedStock, setSelectedStock] = useState<StockDetail | null>(null)
  const [market, setMarket] = useState<Market>('KR')

  const searchQuery = useStockSearchQuery()
  const stockRate = useStockRate()
  const dropdown = useStockDropdown()

  const handleSelectStock = useCallback(async (stock: SearchResult): Promise<void> => {
    dropdown.setShowDropdown(false)
    setSelectedStock({ symbol: stock.symbol, name: stock.name, averageRate: 0, currentPrice: 0 })

    const stockDetail = await stockRate.fetchStockRate(stock)
    
    if (stockDetail) {
      setSelectedStock(stockDetail)
    } else {
      setSelectedStock(null)
    }
  }, [dropdown, stockRate])

  const resetSearch = useCallback((): void => {
    searchQuery.clearResults()
    dropdown.setShowDropdown(false)
    setSelectedStock(null)
    stockRate.resetRate()
  }, [searchQuery, dropdown, stockRate])

  useEffect((): (() => void) | void => {
    if (isManualInput) return
    if (selectedStock) return

    const query: string = stockName.trim()
    if (!query || query.length < 2) {
      searchQuery.clearResults()
      dropdown.setShowDropdown(false)
      return
    }

    const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
      void searchQuery.performSearch(query, market).then(() => {
        dropdown.setShowDropdown(true)
      })
    }, 500)

    return (): void => {
      clearTimeout(timer)
    }
  }, [stockName, market, selectedStock, isManualInput, searchQuery, dropdown])

  return {
    isSearching: searchQuery.isSearching,
    searchResults: searchQuery.searchResults,
    showDropdown: dropdown.showDropdown,
    setShowDropdown: dropdown.setShowDropdown,

    selectedStock,
    setSelectedStock,

    market,
    setMarket,

    annualRate: stockRate.annualRate,
    setAnnualRate: stockRate.setAnnualRate,
    originalSystemRate: stockRate.originalSystemRate,
    setOriginalSystemRate: stockRate.setOriginalSystemRate,
    isRateLoading: stockRate.isRateLoading,
    rateFetchFailed: stockRate.rateFetchFailed,
    setRateFetchFailed: stockRate.setRateFetchFailed,

    handleSelectStock,
    resetSearch,
  }
}

// Re-export types for backward compatibility
export type { SearchResult, StockDetail, Market } from './types/useStockSearch'
