'use client'

import { CircleNotch } from '@phosphor-icons/react'

export default function RateLoading() {
    return (
        <div className="flex items-center gap-2">
            <CircleNotch className="w-4 h-4 animate-spin text-brand-600" />
            <span className="text-sm text-muted-foreground">수익률을 분석하고 있어요...</span>
        </div>
    )
}
