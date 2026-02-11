'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { SearchResult, Market, SearchApiResponse } from './types/useStockSearch'

export interface UseStockSearchQueryReturn {
  isSearching: boolean
  searchResults: SearchResult[]
  performSearch: (query: string, market: Market) => Promise<void>
  clearResults: () => void
}

export function useStockSearchQuery(): UseStockSearchQueryReturn {
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const performSearch = useCallback(async (query: string, market: Market): Promise<void> => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)

      const data: SearchApiResponse = await apiClient(
        `/api/search?query=${encodeURIComponent(query)}&market=${market}`,
      )

      const results: SearchResult[] = Array.isArray(data.stocks) ? data.stocks : []
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const clearResults = useCallback((): void => {
    setSearchResults([])
  }, [])

  return {
    isSearching,
    searchResults,
    performSearch,
    clearResults,
  }
}
