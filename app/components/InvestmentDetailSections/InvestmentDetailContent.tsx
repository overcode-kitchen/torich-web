'use client'

import React from 'react'
import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import { InvestmentDetailOverview } from '@/app/components/InvestmentDetailSections/InvestmentDetailOverview'
import { InvestmentDetailActions } from '@/app/components/InvestmentDetailSections/InvestmentDetailActions'
import { DetailTabs } from '@/app/components/Common/DetailTabs'

import { useInvestmentDetailContext } from '@/app/components/InvestmentDetailSections/InvestmentDetailContext'
import { useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'
import InvestmentDaysPickerSheet from '@/app/components/InvestmentDaysPickerSheet'
import { useInvestmentDaysPicker } from '@/app/hooks/common/useInvestmentDaysPicker'

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

    const daysPicker = useInvestmentDaysPicker({
        initialDays: investmentData.editInvestmentDays,
        onApply: (days) => {
            investmentData.setEditInvestmentDays(days)
            ui.setIsDaysPickerOpen(false)
        },
    })

    return (
        // 폭 제약·가운데 정렬은 SubPageScaffold 본문 컨테이너가 담당한다(중복 max-width 제거).
        <div className="px-6 pb-12">
            <InvestmentDetailOverview
                item={item}
                isEditMode={isEditMode}
                completed={investmentData.completed}
                overviewRef={overviewRef}
                titleRef={titleRef}
            />

            {/* 진행률 박스 + 총 납입액 히어로 - 탭 위, 수정 모드에서는 숨김 */}
            {!isEditMode && (
                <ProgressSection
                    progress={investmentData.progress}
                    completed={investmentData.completed}
                    startDate={investmentData.startDate}
                    endDate={investmentData.endDate}
                    isHabitMode={investmentData.isHabitMode}
                    elapsedMonths={investmentData.elapsedMonths}
                    totalPaidPrincipal={investmentData.totalPaidPrincipal}
                />
            )}

            {/* 섹션 탭바 - 스크롤 전체 기준으로 헤더 바로 아래에 고정 */}
            <DetailTabs
                tabs={[
                    { key: 'info', label: '투자 정보' },
                    { key: 'history', label: '납입 기록' },
                ]}
                activeTab={activeTab}
                onTabClick={(tab) => handleTabClick(tab as typeof activeTab)}
                bleedClassName="-mx-6 px-6"
            />

            <div className="divide-y divide-border-subtle-lighter">
                <InfoSection infoRef={infoRef} />
                {(investmentData.paymentHistory.length > 0 ||
                    investmentData.retroactivePaymentHistory?.length > 0) && (
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

            {isEditMode && ui.isDaysPickerOpen && (
                <InvestmentDaysPickerSheet
                    tempDays={daysPicker.tempDays}
                    isDirty={daysPicker.isDirty}
                    onToggleDay={daysPicker.toggleDay}
                    onApply={daysPicker.applyChanges}
                    onClose={() => {
                        daysPicker.reset()
                        ui.setIsDaysPickerOpen(false)
                    }}
                />
            )}
        </div>
    )
}
