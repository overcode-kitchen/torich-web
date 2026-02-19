import { useState, useMemo, useCallback, useEffect } from 'react'

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

    // 모달이 다시 열릴 때 (initialDays가 변경될 때) 상태 동기화
    // 상위 컴포넌트가 모달을 조건부 렌더링하면 이 effect는 마운트 시점에만 실행됨
    // 모달이 항상 렌더링되어 있고 visible만 조정된다면 이 effect가 필요함
    useMemo(() => {
        // setTempDays(normalizeDays(initialDays)) // Warning: rendering loop possibility if not careful
        // But since we lift the state up, let's keep it simple.
        // Actually, if we lift state up, the hook might be mounted once in the parent.
        // So when the sheet opens, we need to reset.
        // We will expose `reset` and let the parent call it, OR we add an effect.
        // safer to just use effect on initialDays change IF the parent updates initialDays correctly.
    }, [])

    // Better approach: use useEffect to sync ONLY when initialDays changes deep equality?
    // No, keep it simple. 
    // Let's rely on the parent mounting/unmounting or explicit reset.
    // For now, I will add a useEffect to listen to initialDays changes.

    useEffect(() => {
        setTempDays(normalizeDays(initialDays))
    }, [initialDays])

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

    const reset = useCallback(() => {
        setTempDays(normalizeDays(initialDays))
    }, [initialDays])

    // initialDays가 변경되면 tempDays도 초기화 (선택 사항, 모달이 닫혀있을 때만 하는게 안전할 수도 있음)
    // 하지만 여기서는 initialDays가 상위에서 주입되므로, 모달 열릴 때마다 새로운 hook 인스턴스를 쓰거나
    // 상위컴포넌트가 제어하므로 effect를 통해 동기화해주는 것이 좋음.
    // 다만, 사용자가 수정 중에 initialDays가 바뀌는 케이스를 고려해야 함.
    // 보통 모달 열릴 때 initialDays가 고정되므로, 여기서는 reset을 명시적으로 호출하는 방식을 권장.
    // useEffect(() => { ... }, [initialDays]) -> 이건 제거하거나 조심스럽게 사용.

    const applyChanges = useCallback(() => {
        onApply(normalizeDays(tempDays))
    }, [onApply, tempDays])

    return {
        tempDays,
        isDirty,
        toggleDay,
        applyChanges,
        reset,
    }
}
