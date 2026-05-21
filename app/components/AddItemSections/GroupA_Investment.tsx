'use client'

import StockSearchInput from '@/app/components/Common/StockSearchInput'
import MarketSelectionSection from '@/app/components/AddInvestmentSections/MarketSelectionSection'
import ProgressiveField from './ProgressiveField'
import type { UseAddItemFlowReturn } from '@/app/hooks/investment/add/useAddItemFlow'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'

interface GroupA_InvestmentProps {
  form: UseAddInvestmentFormReturn
  flow: UseAddItemFlowReturn
  /** 수동 입력 모달 열기 콜백 — 모달 자체는 page.tsx가 렌더 */
  onOpenManualInputModal: () => void
}

/**
 * 투자 유형의 그룹 A.
 * 시퀀스: recordType(상위 라우터) → market → stockName
 *
 * - market: MarketSelectionSection
 * - stockName: StockSearchInput (검색 결과 드롭다운 + 수동 입력 모달 트리거)
 */
export default function GroupA_Investment({
  form,
  flow,
  onOpenManualInputModal,
}: GroupA_InvestmentProps) {
  const isMarketVisible = flow.visibleFieldIds.includes('market')
  const isStockVisible = flow.visibleFieldIds.includes('stockName')
  const activeField = flow.fieldsInCurrentGroup[flow.currentFieldIndex]
  const marketLabel = form.market === 'KR' ? '국내 주식' : '미국 주식'

  return (
    <div className="space-y-2">
      {isMarketVisible && (
        <ProgressiveField
          label="어느 시장에 투자할까요?"
          answerSummary={marketLabel}
          isActive={activeField === 'market'}
          onEditTap={() => flow.goToGroup('A', 'market')}
        >
          <MarketSelectionSection
            market={form.market}
            onMarketChange={form.handleMarketChange}
          />
        </ProgressiveField>
      )}

      {isStockVisible && (
        <ProgressiveField
          label="어떤 종목에 투자할까요?"
          answerSummary={form.stockName || undefined}
          isActive={activeField === 'stockName'}
          onEditTap={() => flow.goToGroup('A', 'stockName')}
        >
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
        </ProgressiveField>
      )}
    </div>
  )
}
