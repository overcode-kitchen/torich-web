'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../auth/useAuth'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { writePaymentHistoryRow } from '@/app/utils/payment-history-db'

export type PaymentHistoryMap = Map<string, Set<string>> // recordId -> Set<YYYY-MM-DD>

export function usePaymentHistory() {
    const { user } = useAuth()
    const supabase = createClient()
    const [completedPayments, setCompletedPayments] = useState<PaymentHistoryMap>(new Map())
    const [retroactivePayments, setRetroactivePayments] = useState<PaymentHistoryMap>(new Map())
    const [isLoading, setIsLoading] = useState(true)

    const fetchHistory = useCallback(async () => {
        if (!user) {
            setCompletedPayments(new Map())
            setRetroactivePayments(new Map())
            setIsLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('payment_history')
                .select('record_id, payment_date, is_retroactive')
                .eq('user_id', user.id)

            if (error) throw error

            const autoMap = new Map<string, Set<string>>()
            const retroMap = new Map<string, Set<string>>()
            data?.forEach((item) => {
                const target = item.is_retroactive ? retroMap : autoMap
                if (!target.has(item.record_id)) {
                    target.set(item.record_id, new Set())
                }
                target.get(item.record_id)?.add(item.payment_date)
            })
            setCompletedPayments(autoMap)
            setRetroactivePayments(retroMap)
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
        try {
            await writePaymentHistoryRow(supabase, {
                userId: user.id,
                recordId,
                paymentDate: date,
                isRetroactive: false,
                shouldDelete: currentCompleted,
            })
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
        isLoading,
        togglePayment,
        toggleRetroactivePayment,
        refetch: fetchHistory
    }
}
