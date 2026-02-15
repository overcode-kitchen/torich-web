import { useMemo } from 'react'
import { Investment, getStartDate } from '@/app/types/investment'
import { calculateEndDate } from '@/app/utils/date'

export interface CashHoldItemVM {
    id: string
    title: string
    endDate: Date
    maturityValue: number
}

interface UseCashHoldItemsProps {
    items: Investment[]
    selectedYear: number
    calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export function useCashHoldItems({
    items,
    selectedYear,
    calculateFutureValue,
}: UseCashHoldItemsProps) {
    const maturedItems = useMemo(() => {
        // 선택한 기간보다 만기가 짧은 (현금 보관 상태인) 항목들 필터링
        const filtered = items.filter((item) => item.period_years < selectedYear)

        return filtered.map((item): CashHoldItemVM => {
            const startDate = getStartDate(item)
            const endDate = calculateEndDate(startDate, item.period_years)
            const R = item.annual_rate ? item.annual_rate / 100 : 0.10

            // 만기 시점의 평가 금액 (고정된 값)
            const maturityValue = calculateFutureValue(
                item.monthly_amount,
                item.period_years,
                item.period_years, // P represents the period in years for calculation context here
                R
            )

            return {
                id: item.id,
                title: item.title,
                endDate,
                maturityValue,
            }
        })
    }, [items, selectedYear, calculateFutureValue])

    return {
        maturedItems,
    }
}
