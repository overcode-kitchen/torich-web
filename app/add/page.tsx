'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, CircleNotch } from '@phosphor-icons/react'
import MarketSelectionSection from '@/app/components/AddInvestmentSections/MarketSelectionSection'
import FormSection from '@/app/components/AddInvestmentSections/FormSection'
import PreviewSection from '@/app/components/AddInvestmentSections/PreviewSection'
import InvestmentDaysPickerSheet from '@/app/components/InvestmentDaysPickerSheet'
import ManualInputModal from '@/app/components/ManualInputModal'
import RateHelpModal from '@/app/components/RateHelpModal'
import { useAddInvestmentForm } from '@/app/hooks/useAddInvestmentForm'
import { useModalState } from '@/app/hooks/useModalState'

export default function AddInvestmentPage() {
  const router = useRouter()
  const form = useAddInvestmentForm()
  const modals = useModalState()

  return (
    <main className="min-h-screen bg-surface">
      {/* 뒤로가기 버튼 */}
      <header className="h-[52px] flex items-center px-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-foreground-soft hover:text-foreground transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-6">
        {/* 상단 헤더 텍스트 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground mb-3">
            람쥐씨, 어떤 꿈을 꾸고 계신가요?
          </h1>
          <p className="text-sm text-foreground-subtle whitespace-pre-line">
            매달 꾸준히 모았을 때,{'\n'}10년 뒤 얼마가 될지 바로 보여드릴게요.
          </p>
        </div>

        {/* 마켓 선택 탭 */}
        <MarketSelectionSection
          market={form.market}
          onMarketChange={form.handleMarketChange}
        />

        {/* 입력 폼 */}
        <FormSection form={form} modals={modals} />

        {/* 미리보기 섹션 */}
        <PreviewSection
          stockName={form.stockName}
          monthlyAmount={form.monthlyAmount}
          period={form.period}
          annualRate={form.annualRate}
          isRateLoading={form.isRateLoading}
        />

        {/* 저장하기 버튼 */}
        <button
          onClick={form.handleSubmit}
          disabled={form.isSubmitting}
          className="w-full bg-surface-dark text-white font-medium rounded-xl py-4 hover:bg-surface-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {form.isSubmitting ? (
            <>
              <CircleNotch className="w-5 h-5 animate-spin" />
              <span>저장 중...</span>
            </>
          ) : (
            '저장하기'
          )}
        </button>
      </div>

      {/* 매월 투자일 선택 바텀 시트 */}
      {modals.isDaysPickerOpen && (
        <InvestmentDaysPickerSheet
          days={form.investmentDays}
          onClose={() => modals.setIsDaysPickerOpen(false)}
          onApply={(days) => {
            form.setInvestmentDays(days)
            modals.setIsDaysPickerOpen(false)
          }}
        />
      )}
      
      {/* 수동 입력 모달 */}
      <ManualInputModal
        isOpen={form.isManualModalOpen}
        onClose={form.closeAndResetManual}
        stockName={form.manualStockName}
        onStockNameChange={form.setManualStockName}
        rate={form.manualRate}
        onRateChange={form.setManualRate}
        onConfirm={() => {
          form.handleManualConfirm({
            onConfirm: (name: string, rate: number) => {
              form.setIsManualInput(true)
              form.setStockName(name)
              form.setAnnualRate(rate)
              form.setSelectedStock(null)
              form.setOriginalSystemRate(null)
              form.setRateFetchFailed(false)
              form.cancelEdit()
            },
          })
        }}
        onRateHelpClick={() => modals.setIsRateHelpModalOpen(true)}
      />

      {/* 수익률 도움말 모달 */}
      <RateHelpModal
        isOpen={modals.isRateHelpModalOpen}
        onClose={() => modals.setIsRateHelpModalOpen(false)}
      />
    </main>
  )
}