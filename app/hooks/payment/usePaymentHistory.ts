'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../auth/useAuth'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { writePaymentHistoryRow, bulkUpsertRetroactiveRows } from '@/app/utils/payment-history-db'
import { capturePriceForPayment } from '@/app/utils/payment-capture'
import { track, monthOffset, countBucket } from '@/app/lib/analytics'

export type PaymentHistoryMap = Map<string, Set<string>> // recordId -> Set<YYYY-MM-DD>
/** recordId -> (YYYY-MM-DD -> 그 납입 시점 실제 납입액(원). captured_shares × captured_price) */
export type CapturedAmountsMap = Map<string, Map<string, number>>

export function usePaymentHistory() {
    const { user } = useAuth()
    const supabase = createClient()
    const [completedPayments, setCompletedPayments] = useState<PaymentHistoryMap>(new Map())
    const [retroactivePayments, setRetroactivePayments] = useState<PaymentHistoryMap>(new Map())
    // 각 납입의 "그때 실제 납입액"(원). 통계·목적 진척의 실현 원금이 현재 금액이 아니라
    // 매수 시점 금액을 쓰도록 하기 위함. 캡처 없는 옛/소급 납입은 여기에 없어 호출측이 폴백한다.
    const [capturedAmounts, setCapturedAmounts] = useState<CapturedAmountsMap>(new Map())
    const [isLoading, setIsLoading] = useState(true)

    const fetchHistory = useCallback(async () => {
        if (!user) {
            setCompletedPayments(new Map())
            setRetroactivePayments(new Map())
            setCapturedAmounts(new Map())
            setIsLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('payment_history')
                .select('record_id, payment_date, is_retroactive, captured_shares, captured_price')
                .eq('user_id', user.id)

            if (error) throw error

            const autoMap = new Map<string, Set<string>>()
            const retroMap = new Map<string, Set<string>>()
            const capturedMap: CapturedAmountsMap = new Map()
            data?.forEach((item) => {
                const target = item.is_retroactive ? retroMap : autoMap
                if (!target.has(item.record_id)) {
                    target.set(item.record_id, new Set())
                }
                target.get(item.record_id)?.add(item.payment_date)

                // 매수 시점 실제 납입액 = 캡처 주수 × 캡처 시세 (둘 다 있을 때만)
                const shares = item.captured_shares
                const price = item.captured_price
                if (shares != null && price != null && shares > 0 && price > 0) {
                    if (!capturedMap.has(item.record_id)) {
                        capturedMap.set(item.record_id, new Map())
                    }
                    capturedMap.get(item.record_id)?.set(item.payment_date, Math.round(shares * price))
                }
            })
            setCompletedPayments(autoMap)
            setRetroactivePayments(retroMap)
            setCapturedAmounts(capturedMap)
        } catch {
            toastError(TOAST_MESSAGES.paymentHistoryLoadFailed)
        } finally {
            setIsLoading(false)
        }
    }, [user, supabase])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    const applyOptimistic = (
        setter: React.Dispatch<React.SetStateAction<PaymentHistoryMap>>,
        recordId: string,
        date: string,
        currentCompleted: boolean
    ) => {
        setter((prev) => {
            const next = new Map(prev)
            if (!next.has(recordId)) next.set(recordId, new Set())
            const dates = next.get(recordId)!
            if (currentCompleted) dates.delete(date)
            else dates.add(date)
            return next
        })
    }

    const togglePayment = useCallback(async (recordId: string, date: string, currentCompleted: boolean) => {
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
            if (currentCompleted) {
                track('payment_uncheck', { month_offset: monthOffset(date), is_retroactive: false })
            } else {
                track('payment_complete', { month_offset: monthOffset(date), is_retroactive: false })
            }
        } catch {
            toastError(TOAST_MESSAGES.paymentToggleFailed)
            fetchHistory()
        }
    }, [user, supabase, fetchHistory])

    /**
     * 소급(앱 등록 이전) 월 단위 납입 토글
     * @param recordId 투자 ID
     * @param yearMonth "YYYY-MM" 형식
     * @param currentCompleted 현재 기록 여부
     */
    const toggleRetroactivePayment = useCallback(
        async (recordId: string, yearMonth: string, currentCompleted: boolean) => {
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
                if (currentCompleted) {
                    track('payment_uncheck', { month_offset: monthOffset(date), is_retroactive: true })
                } else {
                    track('payment_complete', { month_offset: monthOffset(date), is_retroactive: true })
                }
            } catch {
                toastError(TOAST_MESSAGES.paymentToggleFailed)
                fetchHistory()
            }
        },
        [user, supabase, fetchHistory]
    )

    /**
     * 소급 구간의 여러 월을 한 번에 완료 처리.
     * 이미 기록된 월은 그대로 유지된다 (DB upsert ignoreDuplicates).
     */
    const markAllRetroactivePaid = useCallback(
        async (recordId: string, yearMonths: string[]) => {
            if (!user || yearMonths.length === 0) return
            setRetroactivePayments((prev) => {
                const next = new Map(prev)
                if (!next.has(recordId)) next.set(recordId, new Set())
                const dates = next.get(recordId)!
                yearMonths.forEach((ym) => dates.add(`${ym}-01`))
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
                fetchHistory()
            }
        },
        [user, supabase, fetchHistory]
    )

    return {
        completedPayments,
        retroactivePayments,
        capturedAmounts,
        isLoading,
        togglePayment,
        toggleRetroactivePayment,
        markAllRetroactivePaid,
        refetch: fetchHistory
    }
}
