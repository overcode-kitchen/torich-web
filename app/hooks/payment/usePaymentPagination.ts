import { useState, useEffect } from 'react';

export function usePaymentPagination<T extends { monthLabel: string; yearMonth: string; completed: boolean }>(
  fullPaymentHistory: T[],
  itemId: string
) {
  const [visiblePaymentMonths, setVisiblePaymentMonths] = useState(6);

  // 종목 변경 시 초기화
  useEffect(() => {
    setVisiblePaymentMonths(6);
  }, [itemId]);

  const paymentHistory = fullPaymentHistory.slice(0, visiblePaymentMonths);
  const hasMorePaymentHistory = visiblePaymentMonths < fullPaymentHistory.length;

  const loadMore = () => {
    setVisiblePaymentMonths((prev) => prev + 10);
  };

  return {
    paymentHistory,
    hasMorePaymentHistory,
    loadMore,
  };
}
