'use client'

import { createContext, useContext, useRef, useState, ReactNode } from 'react'
import { scrollToDetailSection } from '@/app/utils/scrollToDetailSection'

export type TabType = 'overview' | 'info' | 'history'

interface InvestmentTabContextType {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  overviewRef: React.RefObject<HTMLElement | null>
  infoRef: React.RefObject<HTMLElement | null>
  historyRef: React.RefObject<HTMLElement | null>
  handleTabClick: (tab: TabType) => void
}

const InvestmentTabContext = createContext<InvestmentTabContextType | undefined>(undefined)

interface InvestmentTabProviderProps {
  children: ReactNode
  initialTab?: TabType
}

export function InvestmentTabProvider({ 
  children, 
  initialTab = 'overview' 
}: InvestmentTabProviderProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const overviewRef = useRef<HTMLElement>(null)
  const infoRef = useRef<HTMLElement>(null)
  const historyRef = useRef<HTMLElement>(null)

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab)
    const target =
      tab === 'overview'
        ? overviewRef.current
        : tab === 'info'
          ? infoRef.current
          : historyRef.current
    scrollToDetailSection(scrollContainerRef.current, target)
  }

  const value = {
    activeTab,
    setActiveTab,
    scrollContainerRef,
    overviewRef,
    infoRef,
    historyRef,
    handleTabClick,
  }

  return (
    <InvestmentTabContext.Provider value={value}>
      {children}
    </InvestmentTabContext.Provider>
  )
}

export function useInvestmentTabContext() {
  const context = useContext(InvestmentTabContext)
  if (context === undefined) {
    throw new Error('useInvestmentTabContext must be used within an InvestmentTabProvider')
  }
  return context
}
