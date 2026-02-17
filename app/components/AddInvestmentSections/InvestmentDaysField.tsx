'use client'

import { Button } from '@/components/ui/button'
import { CalendarBlank } from '@phosphor-icons/react'

interface InvestmentDaysFieldProps {
    investmentDays: number[]
    onOpenDaysPicker: () => void
}

export default function InvestmentDaysField({
    investmentDays,
    onOpenDaysPicker,
}: InvestmentDaysFieldProps) {
    return (
        <div className="rounded-2xl p-4 border border-border-subtle-lighter bg-card space-y-2.5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-foreground">
                        매월 투자일
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        선택하면 다가오는 투자·캘린더에 일정이 표시돼요.
                    </p>
                </div>
            </div>

            {investmentDays.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {[...investmentDays]
                        .sort((a, b) => a - b)
                        .map((day) => (
                            <span
                                key={day}
                                className="inline-flex items-center bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] px-2.5 py-0.5 rounded-full text-xs font-medium"
                            >
                                {day}일
                            </span>
                        ))}
                </div>
            ) : null}

            <Button
                type="button"
                variant="outline"
                onClick={onOpenDaysPicker}
                className="w-full justify-between bg-card rounded-xl h-11 px-4 text-sm text-foreground border-border-subtle hover:bg-surface"
            >
                <span>
                    {investmentDays.length > 0
                        ? `${[...investmentDays]
                            .sort((a, b) => a - b)
                            .join(', ')}일 선택됨`
                        : '날짜 선택하기'}
                </span>
                <CalendarBlank className="w-4 h-4 text-foreground-subtle" />
            </Button>
        </div>
    )
}
