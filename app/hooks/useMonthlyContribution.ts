import { useMemo } from 'react'
import { Investment } from '@/app/types/investment'
import { calculatePercentage } from '@/app/utils/finance'
import { getInitial } from '@/app/utils/string'

export interface MonthlyContributionItemVM {
    id: string
    title: string
    initial: string
    amount: number
    percentage: number
}

interface UseMonthlyContributionProps {
    items: Investment[]
    totalAmount: number
}

export function useMonthlyContribution({
    items,
    totalAmount,
}: UseMonthlyContributionProps) {
    const contributionItems = useMemo(() => {
        return items.map((item): MonthlyContributionItemVM => ({
            id: item.id,
            title: item.title,
            initial: getInitial(item.title),
            amount: item.monthly_amount,
            percentage: calculatePercentage(item.monthly_amount, totalAmount),
        }))
    }, [items, totalAmount])

    return {
        contributionItems,
    }
}
