'use client'

import StockSearchInput from '@/app/components/Common/StockSearchInput'
import RateDisplay from '@/app/components/RateDisplay/RateDisplay'
import AmountInput from '@/app/components/Common/AmountInput'
import PeriodInput from '@/app/components/Common/PeriodInput'
import InvestmentStartDateField from './InvestmentStartDateField'
import InvestmentDaysField from './InvestmentDaysField'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'
import type { UseModalStateReturn } from '@/app/hooks/useModalState'

interface FormSectionProps {
  form: UseAddInvestmentFormReturn
  modals: UseModalStateReturn
}

export default function FormSection({ form, modals }: FormSectionProps) {
  return (
    <form onSubmit={form.handleSubmit} className="space-y-4 mb-8">
      {/* 종목명 입력 (검색 기능 포함) */}
      <div>
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
          showDropdown={form.showDropdown}
          onSelectStock={(stock: any) => {
            form.setStockName(stock.name)
            void form.handleSelectStock(stock)
          }}
          onManualInputClick={() => {
            form.setIsManualModalOpen(true)
            form.setManualStockName(form.stockName)
            form.setShowDropdown(false)
          }}
          onDropdownClose={() => form.setShowDropdown(false)}
        />

        <RateDisplay
          isRateLoading={form.isRateLoading}
          rateFetchFailed={form.rateFetchFailed}
          isRateEditing={form.isRateEditing}
          isManualInput={form.isManualInput}
          stockName={form.stockName}
          selectedStock={form.selectedStock}
          annualRate={form.annualRate}
          originalSystemRate={form.originalSystemRate}
          editingRate={form.editingRate}
          onStartEditing={() => form.startEditing(form.annualRate)}
          onConfirmEdit={() => {
            if (form.originalSystemRate !== null) {
              form.confirmEdit((newRate: number) => {
                form.setAnnualRate(newRate)
                form.setRateFetchFailed(false)
              })
            } else {
              form.confirmEdit((newRate: number) => form.setAnnualRate(newRate))
            }
          }}
          onCancelEdit={form.cancelEdit}
          onRateChange={form.handleRateChange}
          onRateHelpClick={() => modals.setIsRateHelpModalOpen(true)}
        />
      </div>

      {/* 월 투자액 입력 (만원 단위) */}
      <AmountInput
        value={form.monthlyAmount}
        onChange={form.handleAmountChange}
        onAdjust={form.adjustAmount}
      />

      {/* 투자 기간 입력 */}
      <PeriodInput
        value={form.period}
        onChange={form.handlePeriodChange}
        onAdjust={form.adjustPeriod}
      />

      {/* 투자 시작일 입력 */}
      <InvestmentStartDateField
        startDate={form.startDate}
        setStartDate={form.setStartDate}
        isOpen={modals.isDatePickerOpen}
        onOpenChange={modals.setIsDatePickerOpen}
      />

      {/* 매월 투자일 선택 - 요약 + 바텀 시트 */}
      <InvestmentDaysField
        investmentDays={form.investmentDays}
        onOpenDaysPicker={() => modals.setIsDaysPickerOpen(true)}
      />
    </form>
  )
}
