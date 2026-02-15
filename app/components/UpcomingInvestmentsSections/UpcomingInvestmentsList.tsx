'use client'

import { formatCurrency } from '@/lib/utils'
import { formatPaymentDateShort } from '@/app/utils/date'
import type { Investment } from '@/app/types/investment'
import type { DisplayItem } from '@/app/hooks/useUpcomingInvestments'

interface UpcomingInvestmentsListProps {
    displayItems: DisplayItem[]
    toggleComplete: (id: string, paymentDate: Date, dayOfMonth: number) => void
    expandState: {
        expanded: boolean
        setExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void
        hasMore: boolean
        remainingCount: number
    }
}

export default function UpcomingInvestmentsList({
    displayItems,
    toggleComplete,
    expandState,
}: UpcomingInvestmentsListProps) {
    const { expanded, setExpanded, hasMore, remainingCount } = expandState

    return (
        <>
            <div className="space-y-2">
                {displayItems.map((item) => (
                    <div
                        key={`${item.investment.id}-${item.paymentDate.getTime()}-${item.dayOfMonth}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {formatPaymentDateShort(item.paymentDate)} · {item.investment.title}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-bold text-foreground">
                                {formatCurrency(item.investment.monthly_amount)}
                            </span>
                            <button
                                type="button"
                                onClick={() => toggleComplete(item.investment.id, item.paymentDate, item.dayOfMonth)}
                                className="px-3 py-1.5 rounded-lg border border-border text-foreground-muted text-xs font-medium hover:bg-surface-hover hover:border-surface-strong-hover transition-colors"
                                aria-label="납입 완료 체크"
                            >
                                완료하기
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {hasMore && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="w-full mt-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-xl transition-colors"
                    aria-expanded={expanded}
                >
                    {expanded ? '접기' : `${remainingCount}건 더 보기`}
                </button>
            )}
        </>
    )
}
