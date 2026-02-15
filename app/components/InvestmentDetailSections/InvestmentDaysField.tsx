'use client'

import React from 'react'
import { formatInvestmentDays } from '@/app/types/investment'

interface InvestmentDaysFieldProps {
    isEditMode: boolean
    investmentDays: number[]
    onToggleDay?: (day: number) => void
    onOpenDaysPicker?: () => void
}

export function InvestmentDaysField({
    isEditMode,
    investmentDays,
    onToggleDay,
    onOpenDaysPicker,
}: InvestmentDaysFieldProps) {
    if (isEditMode) {
        return (
            <div className="space-y-1.5">
                <label className="block text-foreground font-bold text-base">
                    매월 투자일
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {[...investmentDays].sort((a, b) => a - b).map((day) => (
                        <span
                            key={day}
                            className="inline-flex items-center gap-1 bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] px-2 py-0.5 rounded-full text-xs font-medium"
                        >
                            {day}일
                            <button
                                type="button"
                                onClick={() => onToggleDay?.(day)}
                                className="hover:text-brand-900"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={onOpenDaysPicker}
                        className="inline-flex items-center bg-surface-hover text-foreground-soft px-2 py-0.5 rounded-full text-xs font-semibold hover:bg-secondary transition-colors"
                    >
                        + 추가
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">매월 투자일</span>
            <span className="text-base font-semibold text-foreground">
                {formatInvestmentDays(investmentDays)}
            </span>
        </div>
    )
}
