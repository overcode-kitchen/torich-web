'use client'

import { useRef } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MAX_ITEM_NAME_LENGTH } from '@/app/constants/input-limits'
import { type SearchResult } from '@/app/hooks/stock/useStockSearch'
import { useDropdownMaxHeight } from '@/app/hooks/ui/useDropdownMaxHeight'

interface StockSearchInputProps {
  stockName: string
  onStockNameChange: (value: string) => void
  market: 'KR' | 'US'
  isSearching: boolean
  searchResults: SearchResult[]
  /** 결과가 상위 N건으로 잘렸는지 — 더 있다는 사실을 감추지 않기 위해 안내를 띄운다 */
  hasMoreResults: boolean
  searchFetchFailed: boolean
  onRetrySearch: () => void
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
  hasMoreResults,
  searchFetchFailed,
  onRetrySearch,
  showDropdown,
  onSelectStock,
  onManualInputClick,
  onDropdownClose,
}: StockSearchInputProps) {
  // 드롭다운은 하단 고정 CTA 바보다 아래(z-index)에 그려지므로, 높이를 고정하면 끝부분이 덮인다.
  // 입력창 위치를 기준으로 실제 남은 공간만큼만 펼친다. (#207)
  const anchorRef = useRef<HTMLDivElement>(null)
  const dropdownMaxHeight = useDropdownMaxHeight(anchorRef, showDropdown)

  return (
    <div ref={anchorRef} className="relative stock-search-container">
      <input
        type="text"
        value={stockName}
        onChange={(e) => onStockNameChange(e.target.value)}
        maxLength={MAX_ITEM_NAME_LENGTH}
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
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-lg border border-border-subtle z-10 overflow-y-auto overscroll-contain"
          style={{ maxHeight: dropdownMaxHeight }}
        >
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
              <div className="text-label text-muted-foreground mt-1">
                {stock.symbol}
                {stock.group && ` · ${stock.group}`}
              </div>
            </button>
          ))}

          {/* 잘린 결과가 남아 있으면 그 사실을 알린다 — 20건 안에 없으면 사용자는 '없다'고 오해한다 */}
          {hasMoreResults && (
            <p className="px-5 py-3 text-caption text-muted-foreground text-center border-t border-border-subtle">
              결과가 더 있어요. 검색어를 더 자세히 입력해 보세요
            </p>
          )}
        </div>
      )}

      {/* 검색 요청 실패 */}
      {showDropdown &&
        searchFetchFailed &&
        !isSearching &&
        stockName.trim().length >= 2 && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-lg border border-border-subtle z-10 overflow-y-auto overscroll-contain"
            style={{ maxHeight: dropdownMaxHeight }}
          >
            <div className="px-5 py-4 text-center space-y-3">
              <p className="text-body text-foreground">
                지금 검색 결과를 불러오지 못했어요.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:flex-wrap">
                <Button
                  type="button"
                  size="lg"
                  className="w-full sm:w-auto rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRetrySearch()
                  }}
                >
                  다시 시도
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation()
                    onManualInputClick()
                  }}
                >
                  직접 입력하기
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* 정상 응답 · 결과 0건 — 직접 입력 안내 */}
      {showDropdown &&
        !searchFetchFailed &&
        searchResults.length === 0 &&
        !isSearching &&
        stockName.trim().length >= 2 && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-lg border border-border-subtle z-10 overflow-y-auto overscroll-contain"
            style={{ maxHeight: dropdownMaxHeight }}
          >
            <div className="px-5 py-4 text-center">
              <p className="text-body text-muted-foreground mb-3">
                조건에 맞는 종목이 없어요
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
