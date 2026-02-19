'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { type SearchResult } from '@/app/hooks/stock/useStockSearch'

interface StockSearchInputProps {
  stockName: string
  onStockNameChange: (value: string) => void
  market: 'KR' | 'US'
  isSearching: boolean
  searchResults: SearchResult[]
  showDropdown: boolean
  onSelectStock: (stock: SearchResult) => void
  onManualInputClick: () => void
  onDropdownClose: () => void
}

export default function StockSearchInput({
  stockName,
  onStockNameChange,
  market,
  isSearching,
  searchResults,
  showDropdown,
  onSelectStock,
  onManualInputClick,
  onDropdownClose,
}: StockSearchInputProps) {
  return (
    <div className="relative stock-search-container">
      <input
        type="text"
        value={stockName}
        onChange={(e) => onStockNameChange(e.target.value)}
        placeholder={market === 'KR' ? '삼성전자, TIGER...' : 'S&P 500, AAPL...'}
        className="w-full bg-card rounded-2xl py-3.5 pl-4 pr-12 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
        autoComplete="off"
      />
      
      {/* 로딩 스피너 */}
      {isSearching && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2">
          <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 드롭다운 검색 결과 */}
      {showDropdown && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-lg border border-border-subtle overflow-hidden z-10 max-h-80 overflow-y-auto">
          {searchResults.map((stock) => (
            <button
              key={stock.symbol}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelectStock(stock)
              }}
              className="w-full px-5 py-4 text-left hover:bg-surface-hover transition-colors border-b border-border-subtle last:border-b-0"
            >
              <div className="font-medium text-foreground">
                {stock.name}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stock.symbol}
                {stock.group && ` · ${stock.group}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 - 직접 입력 안내 */}
      {showDropdown && searchResults.length === 0 && !isSearching && stockName.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-lg border border-border-subtle overflow-hidden z-10">
          <div className="px-5 py-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              찾으시는 종목이 없나요?
            </p>
            <button
              type="button"
              onClick={onManualInputClick}
              className="w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-xl hover:bg-primary/90 transition-colors"
            >
              직접 입력하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
