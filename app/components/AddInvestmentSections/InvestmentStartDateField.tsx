'use client'

import { CalendarBlank } from '@phosphor-icons/react'
import InvestmentStartDateSheet from './InvestmentStartDateSheet'

interface InvestmentStartDateFieldProps {
    startDate: Date
    setStartDate: (date: Date) => void
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export default function InvestmentStartDateField({
    startDate,
    setStartDate,
    isOpen,
    onOpenChange,
}: InvestmentStartDateFieldProps) {
    return (
        <>
            <div className="rounded-2xl p-4 border border-border-subtle-lighter bg-card space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            투자 시작일
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            투자를 시작한 날짜를 선택하세요.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onOpenChange(true)}
                    className="w-full flex items-center justify-between bg-card rounded-xl h-11 px-4 text-sm text-foreground border border-border-subtle hover:bg-surface transition-colors"
                >
                    <span>
                        {startDate.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                    <CalendarBlank className="w-4 h-4 text-foreground-subtle" />
                </button>
            </div>

            {isOpen && (
                <InvestmentStartDateSheet
                    selectedDate={startDate}
                    onSelect={setStartDate}
                    onClose={() => onOpenChange(false)}
                />
            )}
        </>
    )
}
