import { useState, useRef } from 'react';

export type TabType = 'overview' | 'info' | 'history';

export function useInvestmentTabs(initialTab: TabType = 'overview') {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLElement | null>(null);
  const infoRef = useRef<HTMLElement | null>(null);
  const historyRef = useRef<HTMLElement | null>(null);

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    const container = scrollContainerRef.current;
    if (!container) return;

    const target =
      tab === 'overview'
        ? overviewRef.current
        : tab === 'info'
          ? infoRef.current
          : historyRef.current;

    if (!target) return;

    const headerAndTabsHeight = 52 + 40;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const currentScrollTop = container.scrollTop;
    const offset = targetRect.top - containerRect.top + currentScrollTop - headerAndTabsHeight;

    container.scrollTo({ top: offset, behavior: 'smooth' });
  };

  return {
    activeTab,
    setActiveTab,
    scrollContainerRef,
    overviewRef,
    infoRef,
    historyRef,
    handleTabClick,
  };
}
