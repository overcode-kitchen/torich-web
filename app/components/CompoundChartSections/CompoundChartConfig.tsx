'use client'

export const formatYAxisTick = (value: number) => {
    if (value >= 10000) {
        return `${Math.floor(value / 10000)}만`
    }
    return `${value}`
}

export const formatXAxisTick = (value: number, data: any[]) => {
    const dataPoint = data.find((d) => d.month === value)
    return dataPoint?.monthLabel || ''
}

export const legendFormatter = (value: string) => {
    return <span className="text-xs text-foreground-soft">{value}</span>
}

export const chartMargins = { top: 5, right: 10, left: 0, bottom: 5 }
