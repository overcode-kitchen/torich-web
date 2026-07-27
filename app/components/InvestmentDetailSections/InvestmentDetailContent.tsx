'use client'

import React from 'react'
import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import { DetailTabs } from '@/app/components/Common/DetailTabs'

import { useInvestmentDetailContext } from '@/app/components/InvestmentDetailSections/InvestmentDetailContext'
import { useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'

export function InvestmentDetailContent() {
    const { investmentData } = useInvestmentDetailContext()

    const {
        activeTab,
        handleTabClick,
        overviewRef,
        infoRef,
        historyRef,
    } = useInvestmentTabContext()

    return (
        // 폭 제약·가운데 정렬은 SubPageScaffold 본문 컨테이너가 담당한다(중복 max-width 제거).
        <div className="px-6 pb-12">
            {/* 이름은 앱바에 상주(InvestmentDetailView centerSlot)하고, 본문 최상단은
                총 납입액 히어로 하나로 유지한다. 종목명 요약은 히어로 아래 보조 줄로 종속. */}
            <section ref={overviewRef}>
                <ProgressSection
                    progress={investmentData.progress}
                    completed={investmentData.completed}
                    startDate={investmentData.startDate}
                    endDate={investmentData.endDate}
                    isHabitMode={investmentData.isHabitMode}
                    elapsedMonths={investmentData.elapsedMonths}
                    totalPaidPrincipal={investmentData.totalPaidPrincipal}
                />
            </section>

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
        </div>
    )
}
