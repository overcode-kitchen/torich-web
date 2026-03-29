export interface UseAddInvestmentFormReturn {
  // 기본 폼 상태
  stockName: string
  setStockName: (name: string) => void
  monthlyAmount: string
  period: string
  startDate: Date
  setStartDate: (date: Date) => void
  investmentDays: number[]
  setInvestmentDays: (days: number[]) => void

  // 제출 상태
  isSubmitting: boolean
  userId: string | null

  // 입력 처리
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  adjustAmount: (delta: number) => void
  handlePeriodChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  adjustPeriod: (delta: number) => void

  // 주식 검색 관련
  isSearching: boolean
  searchResults: any[]
  searchFetchFailed: boolean
  retrySearch: () => void
  showDropdown: boolean
  setShowDropdown: (show: boolean) => void
  selectedStock: any
  setSelectedStock: (stock: any) => void
  market: 'KR' | 'US'
  setMarket: (market: 'KR' | 'US') => void
  annualRate: number
  setAnnualRate: (rate: number) => void
  originalSystemRate: number | null
  setOriginalSystemRate: (rate: number | null) => void
  isRateLoading: boolean
  rateFetchFailed: boolean
  setRateFetchFailed: (failed: boolean) => void
  handleSelectStock: (stock: any) => Promise<void>
  resetSearch: () => void

  // 수동 입력 관련
  isManualModalOpen: boolean
  setIsManualModalOpen: (open: boolean) => void
  manualStockName: string
  setManualStockName: (name: string) => void
  manualRate: string
  setManualRate: (rate: string) => void
  isManualInput: boolean
  setIsManualInput: (manual: boolean) => void
  handleManualConfirm: (callbacks: { onConfirm: (name: string, rate: number) => void }) => void
  closeAndResetManual: () => void

  // 수익률 편집 관련
  isRateEditing: boolean
  editingRate: string
  startEditing: (currentRate: number) => void
  confirmEdit: (onConfirm: (newRate: number) => void) => void
  cancelEdit: () => void
  handleRateChange: (value: string) => void

  // 폼 제출
  handleSubmit: (e: React.FormEvent) => Promise<void>

  // 유틸리티
  handleMarketChange: (newMarket: 'KR' | 'US') => void
}
