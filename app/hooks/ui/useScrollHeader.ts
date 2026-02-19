import { useState, useEffect } from 'react';

export function useScrollHeader(titleRef: React.RefObject<HTMLElement | HTMLDivElement | null>) {
  const [showStickyTitle, setShowStickyTitle] = useState(false);

  useEffect(() => {
    if (!titleRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyTitle(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-52px 0px 0px 0px', // 헤더 높이만큼 여유
      }
    );

    observer.observe(titleRef.current);

    return () => {
      observer.disconnect();
    };
  }, [titleRef]);

  return {
    showStickyTitle,
  };
}
