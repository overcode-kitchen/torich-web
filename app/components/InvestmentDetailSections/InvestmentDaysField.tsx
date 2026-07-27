'use client'

import React from 'react'
import { formatInvestmentDays } from '@/app/types/investment'

interface InvestmentDaysFieldProps {
    investmentDays: number[]
}

export function InvestmentDaysField({
    investmentDays,
}: InvestmentDaysFieldProps) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">매월 투자일</span>
            <span className="text-base font-semibold text-foreground">
                {formatInvestmentDays(investmentDays)}
            </span>
        </div>
    )
}
