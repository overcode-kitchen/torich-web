'use client'

interface RateErrorProps {
    annualRate: number
    onStartEditing: () => void
}

export default function RateError({ annualRate, onStartEditing }: RateErrorProps) {
    return (
        <div className="text-sm font-medium flex items-center gap-1 flex-wrap">
            <span className="text-amber-600">⚠️</span>
            <span className="text-amber-600">
                데이터를 불러오지 못해 기본 수익률({annualRate}%)로 설정했어요.
            </span>
            <button
                type="button"
                onClick={onStartEditing}
                className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full hover:bg-amber-200 transition-colors ml-1"
            >
                수정
            </button>
        </div>
    )
}
