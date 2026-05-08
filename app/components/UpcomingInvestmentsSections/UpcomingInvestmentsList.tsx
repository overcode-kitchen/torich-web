'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { formatPaymentDateShort } from '@/app/utils/date'
import { getInvestmentAvatarLabel } from '@/app/utils/investmentAvatarLabel'
import type { DisplayItem } from '@/app/hooks/upcoming/useUpcomingInvestments'

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
            <div>
                {displayItems.map((item) => {
                    const inv = item.investment
                    return (
                        <div
                            key={`${inv.id}-${item.paymentDate.getTime()}-${item.dayOfMonth}`}
                            className="flex items-center justify-between gap-3 border-b border-border-subtle px-2 py-2.5 last:border-b-0"
                        >
                            <div className="min-w-0 flex-1">
                                {/* InvestmentItem과 동일: 1줄 = 아바타+종목명, 2줄 = pl-2 보조 */}
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <div
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                                                inv.market === 'US'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)]'
                                            }`}
                                            aria-hidden
                                        >
                                            {getInvestmentAvatarLabel(inv.title)}
                                        </div>
                                        <h3 className="min-w-0 truncate text-base font-semibold text-foreground">
                                            {inv.title}
                                        </h3>
                                    </div>
                                    <div className="pl-2">
                                        <p className="truncate text-sm text-muted-foreground">
                                            {formatPaymentDateShort(item.paymentDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="text-sm font-bold tabular-nums text-foreground">
                                    {inv.unit_type === 'shares' && inv.monthly_shares
                                        ? `${inv.monthly_shares}주`
                                        : formatCurrency(inv.monthly_amount)}
                                </span>
                                <Button
                                    type="button"
                                    variant="soft"
                                    size="xs"
                                    className="shrink-0 px-3"
                                    onClick={() => toggleComplete(inv.id, item.paymentDate, item.dayOfMonth)}
                                    aria-label="납입 완료 체크"
                                >
                                    완료하기
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
            {hasMore && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="mt-3 w-full rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                    aria-expanded={expanded}
                >
                    {expanded ? '접기' : `${remainingCount}건 더 보기`}
                </button>
            )}
        </>
    )
}
