'use client'

import React from 'react'
import { Investment } from '@/app/types/investment'
import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import { InvestmentDetailOverview } from '@/app/components/InvestmentDetailSections/InvestmentDetailOverview'
import { InvestmentDetailActions } from '@/app/components/InvestmentDetailSections/InvestmentDetailActions'
import type { RateSuggestion } from '@/app/components/InvestmentEditSections/InvestmentEditSheet'

import { useInvestmentDetailContext } from '@/app/components/InvestmentDetailSections/InvestmentDetailContext'
import { useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'

export function InvestmentDetailContent() {
    const {
        item,
        isEditMode,
        investmentData,
        ui,
        handlers,
    } = useInvestmentDetailContext()

    const {
        activeTab,
        handleTabClick,
        overviewRef,
        titleRef,
        infoRef,
        historyRef,
    } = useInvestmentTabContext()

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
                <ProgressSection />
            )}

            <div className="divide-y divide-border-subtle-lighter">
                <InfoSection infoRef={infoRef} />
                {investmentData.paymentHistory.length > 0 && (
                    <PaymentHistorySection historyRef={historyRef} />
                )}
            </div>

            {isEditMode && (
                <InvestmentDetailActions
                    handleCancel={handlers.onCancel}
                    handleSave={handlers.onSave}
                    isUpdating={ui.isUpdating}
                />
            )}
        </div>
    )
}
