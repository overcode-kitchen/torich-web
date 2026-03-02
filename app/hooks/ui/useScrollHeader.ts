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
        // IntersectionObserver 는 rootMargin 에 calc/env 를 허용하지 않고,
        // 반드시 px 또는 % 로만 받아서, 대략적인 헤더 높이인 52px 기준으로 유지한다.
        rootMargin: '-52px 0px 0px 0px',
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
