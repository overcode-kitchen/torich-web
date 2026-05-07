'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface PullToRefreshIndicatorProps {
    pullDistance: number
    isRefreshing: boolean
    threshold: number
    topOffset: string
}

export default function PullToRefreshIndicator({
    pullDistance,
    isRefreshing,
    threshold,
    topOffset,
}: PullToRefreshIndicatorProps) {
    const reached = pullDistance >= threshold
    const progress = Math.min(1, pullDistance / threshold)
    const visible = pullDistance > 0 || isRefreshing
    const translateY = pullDistance - 36
    const isAnimating = pullDistance === 0 || isRefreshing
    const rotate = isRefreshing ? 0 : progress * 270

    return (
        <div
            className="fixed inset-x-0 z-20 flex items-center justify-center pointer-events-none"
            style={{
                top: topOffset,
                transform: `translateY(${translateY}px)`,
                opacity: visible ? progress : 0,
                transition: isAnimating
                    ? 'transform 220ms ease-out, opacity 220ms ease-out'
                    : 'none',
            }}
            aria-hidden={!visible}
        >
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-card shadow-md border border-border-subtle">
                <CircleNotch
                    className={cn(
                        'w-4 h-4 transition-colors',
                        isRefreshing && 'animate-spin',
                        reached || isRefreshing ? 'text-brand-600' : 'text-muted-foreground',
                    )}
                    weight="bold"
                    style={isRefreshing ? undefined : { transform: `rotate(${rotate}deg)` }}
                />
            </div>
        </div>
    )
}
