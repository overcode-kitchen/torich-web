import { useState, useEffect } from 'react';

export function useScrollHeader(
  titleRef: React.RefObject<HTMLElement | HTMLDivElement | null>,
  // 관찰 대상이 처음 마운트되지 않는 화면(로딩 분기 뒤에야 제목이 렌더되는 목적 상세 등)을 위해,
  // 대상이 준비된 시점에 이 값을 true로 넘기면 그때 옵저버를 다시 붙인다. 기본 true(대상이 항상 마운트된 화면).
  enabled: boolean = true,
) {
  const [showStickyTitle, setShowStickyTitle] = useState(false);

  useEffect(() => {
    if (!enabled || !titleRef.current) return;

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
  }, [titleRef, enabled]);

  return {
    showStickyTitle,
  };
}
