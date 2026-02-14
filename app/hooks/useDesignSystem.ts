'use client'

import { useState } from 'react'

export const TABS = [
    { id: 'core', label: '기본' },
    { id: 'patterns', label: '패턴' },
    { id: 'tokens', label: '토큰' },
] as const

export type TabId = (typeof TABS)[number]['id']

export interface UseDesignSystemReturn {
    activeTab: TabId
    setActiveTab: (tab: TabId) => void
    tabs: typeof TABS
}

export function useDesignSystem(): UseDesignSystemReturn {
    const [activeTab, setActiveTab] = useState<TabId>('core')

    return {
        activeTab,
        setActiveTab,
        tabs: TABS,
    }
}
