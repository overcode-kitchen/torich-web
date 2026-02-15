import { useState, useEffect } from 'react'
import type { Investment } from '@/app/types/investment'

const INITIAL_LIST_COUNT = 10

interface UseDashboardUIProps {
    filteredRecords: Investment[]
    filterStatus: string
    sortBy: string
}

export function useDashboardUI({
    filteredRecords,
    filterStatus,
    sortBy,
}: UseDashboardUIProps) {
    const [listExpanded, setListExpanded] = useState(false)

    // Reset expansion when filter or sort changes
    useEffect(() => {
        setListExpanded(false)
    }, [filterStatus, sortBy])

    const displayRecords = listExpanded
        ? filteredRecords
        : filteredRecords.slice(0, INITIAL_LIST_COUNT)

    const hasMoreList = filteredRecords.length > INITIAL_LIST_COUNT
    const remainingListCount = filteredRecords.length - INITIAL_LIST_COUNT

    const toggleListExpansion = () => setListExpanded((prev) => !prev)

    return {
        listExpanded,
        displayRecords,
        hasMoreList,
        remainingListCount,
        toggleListExpansion,
    }
}
