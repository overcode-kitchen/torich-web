'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export interface SearchResult {
  symbol: string
  name: string
  group?: string
}

export interface StockDetail {
  symbol: string
  name: string
  averageRate: number
  currentPrice: number
}

type Market = 'KR' | 'US'

type UseStockSearchReturn = {
  isSearching: boolean
  searchResults: SearchResult[]
  showDropdown: boolean
  setShowDropdown: Dispatch<SetStateAction<boolean>>

  selectedStock: StockDetail | null
  setSelectedStock: Dispatch<SetStateAction<StockDetail | null>>

  market: Market
  setMarket: Dispatch<SetStateAction<Market>>

  annualRate: number
  setAnnualRate: Dispatch<SetStateAction<number>>
  originalSystemRate: number | null
  setOriginalSystemRate: Dispatch<SetStateAction<number | null>>
  isRateLoading: boolean
  rateFetchFailed: boolean
  setRateFetchFailed: Dispatch<SetStateAction<boolean>>

  handleSelectStock: (stock: SearchResult) => Promise<void>
  resetSearch: () => void
}

type SearchApiResponse = {
  stocks?: SearchResult[]
}

type StockApiResponse = Partial<StockDetail> & {
  averageRate?: number
}

export function useStockSearch(stockName: string, isManualInput: boolean): UseStockSearchReturn {
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const [selectedStock, setSelectedStock] = useState<StockDetail | null>(null)
  const [market, setMarket] = useState<Market>('KR')

  const [annualRate, setAnnualRate] = useState<number>(10)
  const [originalSystemRate, setOriginalSystemRate] = useState<number | null>(null)
  const [isRateLoading, setIsRateLoading] = useState<boolean>(false)
  const [rateFetchFailed, setRateFetchFailed] = useState<boolean>(false)

  const resetSearch = useCallback((): void => {
    setSearchResults([])
    setShowDropdown(false)
    setSelectedStock(null)
    setAnnualRate(10)
    setOriginalSystemRate(null)
    setIsRateLoading(false)
    setRateFetchFailed(false)
    setIsSearching(false)
  }, [])

  useEffect((): (() => void) | void => {
    if (isManualInput) return
    if (selectedStock) return

    const query: string = stockName.trim()
    if (!query || query.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
      void (async (): Promise<void> => {
        try {
          setIsSearching(true)
          setShowDropdown(false)

          const response: Response = await fetch(
            `/api/search?query=${encodeURIComponent(query)}&market=${market}`,
          )
          const data: SearchApiResponse = (await response.json()) as SearchApiResponse

          const results: SearchResult[] = Array.isArray(data.stocks) ? data.stocks : []
          setSearchResults(results)
          setShowDropdown(true)
        } catch {
          setSearchResults([])
          setShowDropdown(false)
        } finally {
          setIsSearching(false)
        }
      })()
    }, 500)

    return (): void => {
      clearTimeout(timer)
    }
  }, [stockName, market, selectedStock, isManualInput])

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

  const handleSelectStock = useCallback(async (stock: SearchResult): Promise<void> => {
    try {
      setShowDropdown(false)
      setSelectedStock({ symbol: stock.symbol, name: stock.name, averageRate: 0, currentPrice: 0 })
      setIsSearching(true)
      setIsRateLoading(true)
      setRateFetchFailed(false)

      const response: Response = await fetch(`/api/stock?symbol=${encodeURIComponent(stock.symbol)}`)
      const data: StockApiResponse = (await response.json()) as StockApiResponse

      const averageRate: number | undefined = typeof data.averageRate === 'number' ? data.averageRate : undefined

      if (response.ok && averageRate !== undefined) {
        const detail: StockDetail = {
          symbol: typeof data.symbol === 'string' ? data.symbol : stock.symbol,
          name: typeof data.name === 'string' ? data.name : stock.name,
          averageRate,
          currentPrice: typeof data.currentPrice === 'number' ? data.currentPrice : 0,
        }
        setSelectedStock(detail)
        setAnnualRate(detail.averageRate)
        setOriginalSystemRate(detail.averageRate)
        setRateFetchFailed(false)
      } else {
        setSelectedStock(null)
        setAnnualRate(10)
        setOriginalSystemRate(null)
        setRateFetchFailed(true)
      }
    } catch {
      setSelectedStock(null)
      setAnnualRate(10)
      setOriginalSystemRate(null)
      setRateFetchFailed(true)
    } finally {
      setIsSearching(false)
      setIsRateLoading(false)
    }
  }, [])

  return {
    isSearching,
    searchResults,
    showDropdown,
    setShowDropdown,
    selectedStock,
    setSelectedStock,
    market,
    setMarket,
    annualRate,
    setAnnualRate,
    originalSystemRate,
    setOriginalSystemRate,
    isRateLoading,
    rateFetchFailed,
    setRateFetchFailed,
    handleSelectStock,
    resetSearch,
  }
}
