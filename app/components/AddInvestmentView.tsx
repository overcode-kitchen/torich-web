'use client'

import { CircleNotch } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import MarketSelectionSection from '@/app/components/AddInvestmentSections/MarketSelectionSection'
import FormSection from '@/app/components/AddInvestmentSections/FormSection'
import PreviewSection from '@/app/components/AddInvestmentSections/PreviewSection'
import InvestmentDaysPickerSheet from '@/app/components/InvestmentDaysPickerSheet'
import ManualInputModal from '@/app/components/ManualInputModal'
import type { UseAddInvestmentFormReturn } from '@/app/hooks/types/useAddInvestmentForm'
import type { UseModalStateReturn } from '@/app/hooks/ui/useModalState'
import type { useInvestmentDaysPicker } from '@/app/hooks/common/useInvestmentDaysPicker'

interface AddInvestmentViewProps {
    form: UseAddInvestmentFormReturn
    modals: UseModalStateReturn
    daysPicker: ReturnType<typeof useInvestmentDaysPicker>
    onBack: () => void
    /** 목적 만들기 흐름일 때만 전달. "나중에 할게요"로 건너뛴다. */
    onSkip?: () => void
}

export default function AddInvestmentView({
    form,
    modals,
    daysPicker,
    onBack,
    onSkip
}: AddInvestmentViewProps) {
    return (
        <>
            <SubPageScaffold onBack={onBack} contentClassName="py-6">
                {/* 상단 헤더 텍스트 — 목적 흐름(onSkip 존재)이면 맥락 안내를 보여준다 */}
                <div className="mb-8">
                    {onSkip ? (
                        <>
                            <h1 className="text-xl font-bold text-foreground mb-3">
                                목적을 위한 적립 항목을 추가해요
                            </h1>
                            <p className="text-sm text-foreground-subtle">
                                이 목적에 매달 모을 항목을 정해보세요. 적금·적립식 투자 모두 좋아요.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold text-foreground mb-3">
                                람쥐씨, 어떤 꿈을 꾸고 계신가요?
                            </h1>
                            <p className="text-sm text-foreground-subtle whitespace-pre-line">
                                매달 꾸준히 모으는 항목을 추가해요.
                            </p>
                        </>
                    )}
                </div>

                {/* 마켓 선택 탭 */}
                <MarketSelectionSection
                    market={form.market}
                    onMarketChange={form.handleMarketChange}
                />

                {/* 입력 폼 (단위 전환 토글은 입력 박스 안에서 노출됨) */}
                <FormSection form={form} modals={modals} />

                {/* 미리보기 섹션 */}
                <PreviewSection
                    stockName={form.stockName}
                    monthlyAmount={form.monthlyAmount}
                    period={form.period}
                    isHabitMode={form.isHabitMode}
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

                {/* 목적 만들기 흐름: 적립 항목 추가를 건너뛰고 홈으로 */}
                {onSkip && (
                    <button
                        type="button"
                        onClick={onSkip}
                        disabled={form.isSubmitting}
                        className="w-full py-3 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        나중에 할게요
                    </button>
                )}
            </SubPageScaffold>

            {/* 매월 투자일 선택 바텀 시트 */}
            {modals.isDaysPickerOpen && (
                <InvestmentDaysPickerSheet
                    tempDays={daysPicker.tempDays}
                    isDirty={daysPicker.isDirty}
                    onToggleDay={daysPicker.toggleDay}
                    onApply={daysPicker.applyChanges}
                    onClose={() => {
                        daysPicker.reset()
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
            />
        </>
    )
}
