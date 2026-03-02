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
import { APP_HEADER_TOTAL_HEIGHT } from '@/app/constants/layout-constants'

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
                overviewRef={overviewRef}
                titleRef={titleRef}
            />

            {/* 전역 섹션 탭바 - 스크롤 전체 기준으로 헤더 바로 아래에 고정 */}
            <div
                className="sticky z-40 -mx-6 px-6 bg-background border-b border-border-subtle-lighter"
                style={{ top: APP_HEADER_TOTAL_HEIGHT }}
            >
                <div className="flex gap-6">
                    <button
                        type="button"
                        onClick={() => handleTabClick('overview')}
                        className={`py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
                            ? 'border-foreground text-foreground'
                            : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                            }`}
                    >
                        개요
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabClick('info')}
                        className={`py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'info'
                            ? 'border-foreground text-foreground'
                            : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                            }`}
                    >
                        투자 정보
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabClick('history')}
                        className={`py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history'
                            ? 'border-foreground text-foreground'
                            : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                            }`}
                    >
                        납입 기록
                    </button>
                </div>
            </div>

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
