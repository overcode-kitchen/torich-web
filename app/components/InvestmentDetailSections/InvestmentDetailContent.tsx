'use client'

import React from 'react'
import { Investment } from '@/app/types/investment'
import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import { InvestmentDetailOverview } from '@/app/components/InvestmentDetailSections/InvestmentDetailOverview'
import { InvestmentDetailActions } from '@/app/components/InvestmentDetailSections/InvestmentDetailActions'
import type { RateSuggestion } from '@/app/components/InvestmentEditSections/InvestmentEditSheet'

interface InvestmentDetailContentProps {
    item: Investment
    isEditMode: boolean
    investmentData: any
    onCancel: () => void
    onSave: () => Promise<void>
    isUpdating: boolean
    setIsDaysPickerOpen: (value: boolean) => void
    infoRef: React.RefObject<HTMLElement | null>
    historyRef: React.RefObject<HTMLElement | null>
    originalRate: number
    formatRate: (rate: number) => string
    rateSuggestions: RateSuggestion[]
    isCustomRate: boolean
    activeTab: any
    handleTabClick: (tab: any) => void
    overviewRef: React.RefObject<HTMLElement | null>
    titleRef: React.RefObject<HTMLDivElement | null>
}

export function InvestmentDetailContent({
    item,
    isEditMode,
    investmentData,
    onCancel,
    onSave,
    isUpdating,
    setIsDaysPickerOpen,
    infoRef,
    historyRef,
    originalRate,
    formatRate,
    rateSuggestions,
    isCustomRate,
    activeTab,
    handleTabClick,
    overviewRef,
    titleRef,
}: InvestmentDetailContentProps) {
    return (
        <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-6 pb-12">
            <InvestmentDetailOverview
                item={item}
                isEditMode={isEditMode}
                nextPaymentDate={investmentData.nextPaymentDate}
                completed={investmentData.completed}
                activeTab={activeTab}
                handleTabClick={handleTabClick}
                overviewRef={overviewRef}
                titleRef={titleRef}
            />

            {/* 진행률 - 수정 모드에서는 숨김 */}
            {!isEditMode && (
                <ProgressSection
                    progress={investmentData.progress}
                    completed={investmentData.completed}
                    startDate={investmentData.startDate}
                    endDate={investmentData.endDate}
                />
            )}

            <div className="divide-y divide-border-subtle-lighter">
                <InfoSection
                    item={item}
                    isEditMode={isEditMode}
                    editMonthlyAmount={investmentData.editMonthlyAmount}
                    setEditMonthlyAmount={investmentData.setEditMonthlyAmount}
                    editPeriodYears={investmentData.editPeriodYears}
                    setEditPeriodYears={investmentData.setEditPeriodYears}
                    editAnnualRate={investmentData.editAnnualRate}
                    setEditAnnualRate={investmentData.setEditAnnualRate}
                    editInvestmentDays={investmentData.editInvestmentDays}
                    setEditInvestmentDays={investmentData.setEditInvestmentDays}
                    setIsDaysPickerOpen={setIsDaysPickerOpen}
                    handleNumericInput={investmentData.handleNumericInput}
                    handleRateInput={investmentData.handleRateInput}
                    displayAnnualRate={investmentData.displayAnnualRate}
                    totalPrincipal={investmentData.totalPrincipal}
                    calculatedProfit={investmentData.calculatedProfit}
                    calculatedFutureValue={investmentData.calculatedFutureValue}
                    originalRate={originalRate}
                    isRateManuallyEdited={investmentData.isRateManuallyEdited}
                    setIsRateManuallyEdited={investmentData.setIsRateManuallyEdited}
                    formatRate={formatRate}
                    rateSuggestions={rateSuggestions}
                    isCustomRate={isCustomRate}
                    infoRef={infoRef}
                />
                {investmentData.paymentHistory.length > 0 && (
                    <PaymentHistorySection
                        item={item}
                        paymentHistory={investmentData.paymentHistory}
                        hasMorePaymentHistory={investmentData.hasMorePaymentHistory}
                        loadMore={investmentData.loadMore}
                        historyRef={historyRef}
                    />
                )}
            </div>

            {isEditMode && (
                <InvestmentDetailActions
                    handleCancel={onCancel}
                    handleSave={onSave}
                    isUpdating={isUpdating}
                />
            )}
        </div>
    )
}
