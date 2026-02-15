'use client'

interface UpcomingInvestmentsEmptyStateProps {
    rangeLabel: string
}

export default function UpcomingInvestmentsEmptyState({ rangeLabel }: UpcomingInvestmentsEmptyStateProps) {
    return (
        <p className="text-sm text-muted-foreground py-4 text-center">
            {rangeLabel} 이내 예정된 투자가 없어요
        </p>
    )
}
