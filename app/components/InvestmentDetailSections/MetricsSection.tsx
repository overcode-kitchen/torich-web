'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'
import { InvestmentField } from '@/app/components/Common/InvestmentField'

interface MetricsSectionProps {
    totalPrincipal: number
    calculatedProfit: number
    calculatedFutureValue: number
}

export function MetricsSection({
    totalPrincipal,
    calculatedProfit,
    calculatedFutureValue,
}: MetricsSectionProps) {
    return (
        <div className="space-y-6">
            <div className="border-t border-border-subtle-lighter my-2" />

            {/* 총 원금 */}
            <InvestmentField
                label="총 원금"
                value={formatCurrency(totalPrincipal)}
                isEditMode={false}
            />

            {/* 예상 수익 */}
            <InvestmentField
                label="예상 수익"
                value={`+ ${formatCurrency(calculatedProfit)}`}
                isEditMode={false}
            />

            {/* 만기 시 예상 금액 */}
            <InvestmentField
                label="만기 시 예상 금액"
                value={formatCurrency(calculatedFutureValue)}
                isEditMode={false}
            />
        </div>
    )
}
