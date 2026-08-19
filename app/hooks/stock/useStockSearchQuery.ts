'use client'

import { useState, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import type { SearchResult, Market, SearchApiResponse } from '../types/useStockSearch'

export interface UseStockSearchQueryReturn {
  isSearching: boolean
  searchResults: SearchResult[]
  hasMoreResults: boolean
  searchFetchFailed: boolean
  performSearch: (query: string, market: Market) => Promise<void>
  retrySearch: () => void
  clearResults: () => void
}

export function useStockSearchQuery(): UseStockSearchQueryReturn {
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [hasMoreResults, setHasMoreResults] = useState<boolean>(false)
  const [searchFetchFailed, setSearchFetchFailed] = useState<boolean>(false)
  const lastSearchRef = useRef<{ query: string; market: Market } | null>(null)

  const performSearch = useCallback(async (query: string, market: Market): Promise<void> => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setHasMoreResults(false)
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
      setHasMoreResults(data.hasMore === true)
      setSearchFetchFailed(false)
    } catch {
      setSearchResults([])
      setHasMoreResults(false)
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
    setHasMoreResults(false)
    setSearchFetchFailed(false)
    lastSearchRef.current = null
  }, [])

  return {
    isSearching,
    searchResults,
    hasMoreResults,
    searchFetchFailed,
    performSearch,
    retrySearch,
    clearResults,
  }
}
