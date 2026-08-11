'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { usePaymentHistoryFetch } from '@/app/hooks/payment/usePaymentHistoryFetch'
import { bulkUpsertRetroactiveRows, writePaymentHistoryRow } from '@/app/utils/payment-history-db'
import { capturePriceForPayment } from '@/app/utils/payment-capture'
import { countBucket, monthOffset, track } from '@/app/lib/analytics'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import type { CapturedAmountsMap, PaymentHistoryMap } from '@/app/types/payment'

export interface PaymentHistoryContextValue {
  /** 자동 추적 납입 (record_id -> Set<YYYY-MM-DD>) */
  completedPayments: PaymentHistoryMap
  /** 소급 납입 (record_id -> Set<YYYY-MM-01>) */
  retroactivePayments: PaymentHistoryMap
  /** 각 납입의 매수 시점 실제 납입액(원). 캡처 없는 건은 없으므로 호출측이 폴백한다 */
  capturedAmounts: CapturedAmountsMap
  /** 최초 1회 조회 중 여부. refetch는 이 값을 다시 true로 만들지 않는다 */
  isLoading: boolean
  togglePayment: (recordId: string, date: string, currentCompleted: boolean) => Promise<void>
  toggleRetroactivePayment: (
    recordId: string,
    yearMonth: string,
    currentCompleted: boolean,
  ) => Promise<void>
  markAllRetroactivePaid: (recordId: string, yearMonths: string[]) => Promise<void>
  refetch: () => Promise<void>
}

const PaymentHistoryContext = createContext<PaymentHistoryContextValue | null>(null)

/**
 * 낙관적 토글. Map뿐 아니라 안쪽 Set까지 새로 만든다 —
 * `new Map(prev)`는 얕은 복사라 Set을 그대로 두면 이전 상태까지 함께 변형된다.
 */
function applyOptimistic(
  setter: Dispatch<SetStateAction<PaymentHistoryMap>>,
  recordId: string,
  date: string,
  currentCompleted: boolean,
): void {
  setter((prev) => {
    const next = new Map(prev)
    const dates = new Set(next.get(recordId) ?? [])
    if (currentCompleted) dates.delete(date)
    else dates.add(date)
    next.set(recordId, dates)
    return next
  })
}

/**
 * 납입 기록 전역 상태.
 *
 * 훅으로 두면 호출하는 화면마다 독립된 state와 독립된 조회가 생긴다. 그래서 홈에서
 * ✓를 눌러도 같은 카드의 목적 진척률(다른 인스턴스)이 움직이지 않았다. records가
 * InvestmentsProvider 하나로 공유되는 것과 같은 이유로 여기도 프로바이더가 맞다.
 *
 * Closes #49 관련 설계 근거는 이슈 본문 참고.
 */
export function PaymentHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [completedPayments, setCompletedPayments] = useState<PaymentHistoryMap>(new Map())
  const [retroactivePayments, setRetroactivePayments] = useState<PaymentHistoryMap>(new Map())
  const [capturedAmounts, setCapturedAmounts] = useState<CapturedAmountsMap>(new Map())

  const { refetch, isLoading } = usePaymentHistoryFetch(
    user?.id,
    setCompletedPayments,
    setRetroactivePayments,
    setCapturedAmounts,
  )

  useEffect(() => {
    void refetch()
  }, [refetch])

  const togglePayment = useCallback(
    async (recordId: string, date: string, currentCompleted: boolean): Promise<void> => {
      if (!user) return
      applyOptimistic(setCompletedPayments, recordId, date, currentCompleted)

      // 새 ✓ 시점에만 시세 캡처. 취소(currentCompleted=true)는 행 자체를 DELETE.
      const captured = currentCompleted
        ? { capturedShares: null, capturedPrice: null, priceFailed: false }
        : await capturePriceForPayment(supabase, user.id, recordId)

      try {
        await writePaymentHistoryRow(supabase, {
          userId: user.id,
          recordId,
          paymentDate: date,
          isRetroactive: false,
          shouldDelete: currentCompleted,
          capturedShares: captured.capturedShares,
          capturedPrice: captured.capturedPrice,
        })
        if (captured.priceFailed) {
          toastError(TOAST_MESSAGES.priceCaptureFailed)
        }
        track(currentCompleted ? 'payment_uncheck' : 'payment_complete', {
          month_offset: monthOffset(date),
          is_retroactive: false,
        })
      } catch {
        toastError(TOAST_MESSAGES.paymentToggleFailed)
        void refetch()
      }
    },
    [user, supabase, refetch],
  )

  /**
   * 소급(앱 등록 이전) 월 단위 납입 토글
   * @param yearMonth "YYYY-MM" 형식
   */
  const toggleRetroactivePayment = useCallback(
    async (recordId: string, yearMonth: string, currentCompleted: boolean): Promise<void> => {
      if (!user) return
      const date = `${yearMonth}-01`
      applyOptimistic(setRetroactivePayments, recordId, date, currentCompleted)
      try {
        await writePaymentHistoryRow(supabase, {
          userId: user.id,
          recordId,
          paymentDate: date,
          isRetroactive: true,
          shouldDelete: currentCompleted,
        })
        track(currentCompleted ? 'payment_uncheck' : 'payment_complete', {
          month_offset: monthOffset(date),
          is_retroactive: true,
        })
      } catch {
        toastError(TOAST_MESSAGES.paymentToggleFailed)
        void refetch()
      }
    },
    [user, supabase, refetch],
  )

  /**
   * 소급 구간의 여러 월을 한 번에 완료 처리.
   * 이미 기록된 월은 그대로 유지된다 (DB upsert ignoreDuplicates).
   */
  const markAllRetroactivePaid = useCallback(
    async (recordId: string, yearMonths: string[]): Promise<void> => {
      if (!user || yearMonths.length === 0) return
      setRetroactivePayments((prev) => {
        const next = new Map(prev)
        const dates = new Set(next.get(recordId) ?? [])
        yearMonths.forEach((ym) => dates.add(`${ym}-01`))
        next.set(recordId, dates)
        return next
      })
      try {
        await bulkUpsertRetroactiveRows(supabase, {
          userId: user.id,
          recordId,
          yearMonths,
        })
        track('payment_complete_bulk', { count_bucket: countBucket(yearMonths.length) })
      } catch {
        toastError(TOAST_MESSAGES.paymentToggleFailed)
        void refetch()
      }
    },
    [user, supabase, refetch],
  )

  // 소비자 전체가 프로바이더 렌더마다 리렌더되지 않도록 고정한다.
  // (홈의 '이번 달 회차 전체 취소'는 회차 수만큼 순차 토글하므로 특히 민감하다)
  const value = useMemo<PaymentHistoryContextValue>(
    () => ({
      completedPayments,
      retroactivePayments,
      capturedAmounts,
      isLoading,
      togglePayment,
      toggleRetroactivePayment,
      markAllRetroactivePaid,
      refetch,
    }),
    [
      completedPayments,
      retroactivePayments,
      capturedAmounts,
      isLoading,
      togglePayment,
      toggleRetroactivePayment,
      markAllRetroactivePaid,
      refetch,
    ],
  )

  return (
    <PaymentHistoryContext.Provider value={value}>{children}</PaymentHistoryContext.Provider>
  )
}

export function usePaymentHistoryContext(): PaymentHistoryContextValue {
  const ctx = useContext(PaymentHistoryContext)
  if (!ctx) {
    throw new Error(
      'usePaymentHistoryContext는 PaymentHistoryProvider 내부에서만 사용할 수 있습니다.',
    )
  }
  return ctx
}
