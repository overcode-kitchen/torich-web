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

export type Market = 'KR' | 'US'

export type SearchApiResponse = {
  stocks?: SearchResult[]
}

export type StockApiResponse = Partial<StockDetail> & {
  averageRate?: number
}

export type UseStockSearchReturn = {
  isSearching: boolean
  searchResults: SearchResult[]
  showDropdown: boolean
  setShowDropdown: (show: boolean) => void

  selectedStock: StockDetail | null
  setSelectedStock: (stock: StockDetail | null) => void

  market: Market
  setMarket: (market: Market) => void

  annualRate: number
  setAnnualRate: (rate: number) => void
  originalSystemRate: number | null
  setOriginalSystemRate: (rate: number | null) => void
  isRateLoading: boolean
  rateFetchFailed: boolean
  setRateFetchFailed: (failed: boolean) => void

  handleSelectStock: (stock: SearchResult) => Promise<void>
  resetSearch: () => void
}
