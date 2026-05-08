'use client'

import { useCallback, useState } from 'react'

export type ToryRaisingPanelTab = 'growth' | 'store' | 'customize'

export function useToryRaisingPanelTabs() {
  const [activeTab, setActiveTab] = useState<ToryRaisingPanelTab>('growth')

  const selectTab = useCallback((tab: ToryRaisingPanelTab) => {
    setActiveTab(tab)
  }, [])

  return { activeTab, selectTab }
}

