'use client'

import { useState, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import type { SearchResult, Market, SearchApiResponse } from '../types/useStockSearch'

export interface UseStockSearchQueryReturn {
  isSearching: boolean
  searchResults: SearchResult[]
  searchFetchFailed: boolean
  performSearch: (query: string, market: Market) => Promise<void>
  retrySearch: () => void
  clearResults: () => void
}

export function useStockSearchQuery(): UseStockSearchQueryReturn {
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchFetchFailed, setSearchFetchFailed] = useState<boolean>(false)
  const lastSearchRef = useRef<{ query: string; market: Market } | null>(null)

  const performSearch = useCallback(async (query: string, market: Market): Promise<void> => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setSearchFetchFailed(false)
      lastSearchRef.current = null
      return
    }

    lastSearchRef.current = { query, market }

    try {
      setIsSearching(true)
      setSearchFetchFailed(false)

      const data: SearchApiResponse = await apiClient(
        `/api/search?query=${encodeURIComponent(query)}&market=${market}`,
      )

      const results: SearchResult[] = Array.isArray(data.stocks) ? data.stocks : []
      setSearchResults(results)
      setSearchFetchFailed(false)
    } catch {
      setSearchResults([])
      setSearchFetchFailed(true)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const retrySearch = useCallback((): void => {
    const last = lastSearchRef.current
    if (!last || last.query.length < 2) return
    void performSearch(last.query, last.market)
  }, [performSearch])

  const clearResults = useCallback((): void => {
    setSearchResults([])
    setSearchFetchFailed(false)
    lastSearchRef.current = null
  }, [])

  return {
    isSearching,
    searchResults,
    searchFetchFailed,
    performSearch,
    retrySearch,
    clearResults,
  }
}
