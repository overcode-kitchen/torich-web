'use client'

import StockSearchInput from '@/app/components/Common/StockSearchInput'
import MarketSelectionSection from '@/app/components/AddInvestmentSections/MarketSelectionSection'
import ProgressiveField from './ProgressiveField'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

interface GroupA_InvestmentProps {
  form: UseAddInvestmentFormReturn
  /** 수동 입력 모달 열기 콜백 — 모달 자체는 page.tsx가 렌더 */
  onOpenManualInputModal: () => void
}

/**
 * 투자 유형 그룹 A: 시장 선택(탭) + 종목 검색을 하나의 질문 영역 안에 함께 노출.
 */
export default function GroupA_Investment({
  form,
  onOpenManualInputModal,
}: GroupA_InvestmentProps) {
  return (
    <ProgressiveField label="어떤 종목에 투자할까요?">
      <div className="space-y-3">
        <MarketSelectionSection
          market={form.market}
          onMarketChange={form.handleMarketChange}
        />
        <StockSearchInput
          stockName={form.stockName}
          onStockNameChange={(value: string) => {
            form.setIsManualInput(false)
            form.setStockName(value)
            form.setSelectedStock(null)
            form.setAnnualRate(10)
            form.setOriginalSystemRate(null)
            form.cancelEdit()
          }}
          market={form.market}
          isSearching={form.isSearching}
          searchResults={form.searchResults}
          searchFetchFailed={form.searchFetchFailed}
          onRetrySearch={form.retrySearch}
          showDropdown={form.showDropdown}
          onSelectStock={(stock) => {
            form.setStockName(stock.name)
            void form.handleSelectStock(stock)
          }}
          onManualInputClick={() => {
            form.setManualStockName(form.stockName)
            form.setShowDropdown(false)
            onOpenManualInputModal()
          }}
          onDropdownClose={() => form.setShowDropdown(false)}
        />
      </div>
    </ProgressiveField>
  )
}
