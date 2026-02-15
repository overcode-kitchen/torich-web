import { useState, useMemo, useCallback } from 'react'

interface UseInvestmentDaysPickerProps {
    initialDays: number[]
    onApply: (days: number[]) => void
}

function normalizeDays(days: number[]) {
    return Array.from(new Set(days))
        .filter((d) => Number.isFinite(d) && d >= 1 && d <= 31)
        .sort((a, b) => a - b)
}

export function useInvestmentDaysPicker({
    initialDays,
    onApply,
}: UseInvestmentDaysPickerProps) {
    const [tempDays, setTempDays] = useState<number[]>(() =>
        normalizeDays(initialDays),
    )

    const isDirty = useMemo(() => {
        const a = normalizeDays(initialDays).join(',')
        const b = normalizeDays(tempDays).join(',')
        return a !== b
    }, [initialDays, tempDays])

    const toggleDay = useCallback((day: number) => {
        setTempDays((prev) => {
            if (prev.includes(day)) return prev.filter((d) => d !== day)
            return normalizeDays([...prev, day])
        })
    }, [])

    const applyChanges = useCallback(() => {
        onApply(normalizeDays(tempDays))
    }, [onApply, tempDays])

    return {
        tempDays,
        isDirty,
        toggleDay,
        applyChanges,
    }
}
