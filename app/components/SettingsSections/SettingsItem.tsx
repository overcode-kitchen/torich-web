'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SettingsItemProps {
    label: string
    subLabel?: string
    href?: string
    onClick?: () => void
    rightElement?: ReactNode
    destructive?: boolean
    className?: string
    disabled?: boolean
    showChevron?: boolean
}

export function SettingsItem({
    label,
    subLabel,
    href,
    onClick,
    rightElement,
    destructive,
    className,
    disabled,
    showChevron,
}: SettingsItemProps) {
    // Determine if checkon should be shown
    // Default: true if interactive (href/onClick) AND no rightElement AND not destructive
    const shouldShowChevron = showChevron !== undefined
        ? showChevron
        : (!!(href || onClick) && !rightElement && !destructive)

    const content = (
        <>
            <div className="flex flex-col items-start">
                <span
                    className={cn(
                        'font-medium transition-colors',
                        destructive ? 'text-destructive' : 'text-foreground',
                        disabled && 'opacity-50'
                    )}
                >
                    {label}
                </span>
                {subLabel && <span className="text-sm text-foreground-muted mt-0.5">{subLabel}</span>}
            </div>
            <div className="flex items-center">
                {rightElement}
                {shouldShowChevron && (
                    <span className="ml-3 text-foreground-subtle text-lg" aria-hidden="true">
                        ›
                    </span>
                )}
            </div>
        </>
    )

    const containerClasses = cn(
        'w-full flex items-center justify-between px-4 py-3 transition-colors text-left',
        (href || onClick) && !disabled ? 'hover:bg-surface-hover cursor-pointer' : '',
        disabled && 'cursor-not-allowed opacity-50',
        className
    )

    if (href) {
        return (
            <Link href={href} className={containerClasses}>
                {content}
            </Link>
        )
    }

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={containerClasses}
                disabled={disabled}
            >
                {content}
            </button>
        )
    }

    return (
        <div className={containerClasses}>
            {content}
        </div>
    )
}
