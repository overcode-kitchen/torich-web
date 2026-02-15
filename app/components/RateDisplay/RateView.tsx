'use client'

import { Info } from '@phosphor-icons/react'

interface RateViewProps {
    isManualInput: boolean
    stockName: string
    annualRate: number
    originalSystemRate: number | null
    onStartEditing: () => void
    onRateHelpClick: () => void
}

export default function RateView({
    isManualInput,
    stockName,
    annualRate,
    originalSystemRate,
    onStartEditing,
    onRateHelpClick,
}: RateViewProps) {
    if (isManualInput) {
        if (!stockName) return null
        return (
            <div className="text-sm text-purple-600 font-medium flex items-center gap-1">
                <span>✏️</span>
                <span>직접 입력한 수익률 {annualRate}%가 적용됩니다</span>
                <button
                    type="button"
                    onClick={onStartEditing}
                    className="px-2 py-0.5 bg-secondary text-foreground-muted text-xs font-medium rounded-full hover:bg-surface-strong transition-colors ml-1"
                >
                    수정
                </button>
            </div>
        )
    }

    // Selected Stock Mode
    const isEditedByUser = originalSystemRate !== null && annualRate !== originalSystemRate

    return (
        <div className="text-sm font-medium flex items-center gap-1 flex-wrap">
            {isEditedByUser ? (
                // 사용자가 수정한 경우
                <>
                    <span className="text-purple-600">✏️</span>
                    <span className="text-purple-600">
                        수익률 {annualRate}%가 적용됩니다
                    </span>
                    <span className="text-xs text-foreground-subtle ml-1">
                        (시스템: {originalSystemRate}%)
                    </span>
                </>
            ) : (
                // 시스템 수익률 그대로
                <>
                    <span className="text-brand-600">📊</span>
                    <span className="text-brand-600">
                        지난 10년 평균 수익률 {annualRate}%가 적용되었어요!
                    </span>
                </>
            )}
            <button
                type="button"
                onClick={onRateHelpClick}
                className="p-1 flex items-center justify-center bg-transparent text-foreground-subtle hover:text-foreground-muted hover:bg-secondary rounded transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="수익률 계산 방식 안내"
            >
                <Info className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={onStartEditing}
                className="px-2 py-0.5 bg-secondary text-foreground-muted text-xs font-medium rounded-full hover:bg-surface-strong transition-colors ml-1"
            >
                수정
            </button>
        </div>
    )
}
