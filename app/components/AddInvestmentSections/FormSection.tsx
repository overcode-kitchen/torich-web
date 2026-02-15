'use client'

import { CalendarBlank, CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import StockSearchInput from '@/app/components/Common/StockSearchInput'
import RateDisplay from '@/app/components/RateDisplay'
import AmountInput from '@/app/components/Common/AmountInput'
import PeriodInput from '@/app/components/Common/PeriodInput'

interface FormSectionProps {
  form: any
  modals: any
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground-soft px-1">
          투자 시작일
        </label>
        <Popover open={modals.isDatePickerOpen} onOpenChange={modals.setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-normal bg-card rounded-2xl h-12 px-4 text-foreground border-border-subtle hover:bg-surface"
            >
              {form.startDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              <CaretDown className="w-5 h-5 text-foreground-subtle" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
            align="center"
          >
            <Calendar
              mode="single"
              selected={form.startDate}
              className="mx-auto"
              onSelect={(date: Date | undefined) => {
                if (date) {
                  form.setStartDate(date)
                  modals.setIsDatePickerOpen(false)
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-foreground-subtle px-1">
          투자를 시작한 날짜를 선택하세요. 기본값은 오늘입니다.
        </p>
      </div>

      {/* 매월 투자일 선택 - 요약 + 바텀 시트 */}
      <div className="rounded-2xl p-4 border border-border-subtle-lighter bg-card space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              매월 투자일
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              선택하면 다가오는 투자·캘린더에 일정이 표시돼요.
            </p>
          </div>
        </div>

        {form.investmentDays.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {[...form.investmentDays].sort((a: number, b: number) => a - b).map((day: number) => (
              <span
                key={day}
                className="inline-flex items-center bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {day}일
              </span>
            ))}
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={() => modals.setIsDaysPickerOpen(true)}
          className="w-full justify-between bg-card rounded-xl h-11 px-4 text-sm text-foreground border-border-subtle hover:bg-surface"
        >
          <span>
            {form.investmentDays.length > 0
              ? `${[...form.investmentDays].sort((a: number, b: number) => a - b).join(', ')}일 선택됨`
              : '날짜 선택하기'}
          </span>
          <CalendarBlank className="w-4 h-4 text-foreground-subtle" />
        </Button>
      </div>
    </form>
  )
}
