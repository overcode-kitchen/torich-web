'use client'

import { useCallback, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { SearchResult, StockDetail, StockApiResponse } from '../types/useStockSearch'

export interface UseStockRateReturn {
  annualRate: number
  originalSystemRate: number | null
  isRateLoading: boolean
  rateFetchFailed: boolean
  setAnnualRate: (rate: number) => void
  setOriginalSystemRate: (rate: number | null) => void
  setRateFetchFailed: (failed: boolean) => void
  fetchStockRate: (stock: SearchResult) => Promise<StockDetail | null>
  resetRate: () => void
}

export function useStockRate(): UseStockRateReturn {
  const [annualRate, setAnnualRate] = useState<number>(10)
  const [originalSystemRate, setOriginalSystemRate] = useState<number | null>(null)
  const [isRateLoading, setIsRateLoading] = useState<boolean>(false)
  const [rateFetchFailed, setRateFetchFailed] = useState<boolean>(false)

  const fetchStockRate = useCallback(async (stock: SearchResult): Promise<StockDetail | null> => {
    try {
      setIsRateLoading(true)
      setRateFetchFailed(false)

      const data: StockApiResponse = await apiClient(`/api/stock?symbol=${encodeURIComponent(stock.symbol)}`)

      const averageRate: number | undefined = typeof data.averageRate === 'number' ? data.averageRate : undefined

      if (averageRate !== undefined) {
        const detail: StockDetail = {
          symbol: typeof data.symbol === 'string' ? data.symbol : stock.symbol,
          name: typeof data.name === 'string' ? data.name : stock.name,
          averageRate,
          currentPrice: typeof data.currentPrice === 'number' ? data.currentPrice : 0,
        }
        
        setAnnualRate(detail.averageRate)
        setOriginalSystemRate(detail.averageRate)
        setRateFetchFailed(false)
        
        return detail
      } else {
        setAnnualRate(10)
        setOriginalSystemRate(null)
        setRateFetchFailed(true)
        
        return null
      }
    } catch {
      setAnnualRate(10)
      setOriginalSystemRate(null)
      setRateFetchFailed(true)
      
      return null
    } finally {
      setIsRateLoading(false)
    }
  }, [])

  const resetRate = useCallback((): void => {
    setAnnualRate(10)
    setOriginalSystemRate(null)
    setIsRateLoading(false)
    setRateFetchFailed(false)
  }, [])

  return {
    annualRate,
    originalSystemRate,
    isRateLoading,
    rateFetchFailed,
    setAnnualRate,
    setOriginalSystemRate,
    setRateFetchFailed,
    fetchStockRate,
    resetRate,
  }
}
