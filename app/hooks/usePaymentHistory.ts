'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from './useAuth'

export type PaymentHistoryMap = Map<string, Set<string>> // recordId -> Set<YYYY-MM-DD>

export function usePaymentHistory() {
    const { user } = useAuth()
    const supabase = createClient()
    const [completedPayments, setCompletedPayments] = useState<PaymentHistoryMap>(new Map())
    const [isLoading, setIsLoading] = useState(true)

    const fetchHistory = useCallback(async () => {
        if (!user) {
            setCompletedPayments(new Map())
            setIsLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('payment_history')
                .select('record_id, payment_date')
                .eq('user_id', user.id)

            if (error) throw error

            const newMap = new Map<string, Set<string>>()
            data?.forEach((item) => {
                if (!newMap.has(item.record_id)) {
                    newMap.set(item.record_id, new Set())
                }
                newMap.get(item.record_id)?.add(item.payment_date)
            })
            setCompletedPayments(newMap)
        } catch (err) {
            console.error('Failed to fetch payment history:', err)
        } finally {
            setIsLoading(false)
        }
    }, [user, supabase])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    const togglePayment = useCallback(async (recordId: string, date: string, currentCompleted: boolean) => {
        if (!user) return

        // Optimistic update
        setCompletedPayments((prev) => {
            const next = new Map(prev)
            if (!next.has(recordId)) {
                next.set(recordId, new Set())
            }
            const dates = next.get(recordId)!
            if (currentCompleted) {
                dates.delete(date)
            } else {
                dates.add(date)
            }
            return next
        })

        try {
            if (currentCompleted) {
                // Delete
                const { error } = await supabase
                    .from('payment_history')
                    .delete()
                    .eq('user_id', user.id)
                    .match({ record_id: recordId, payment_date: date })

                if (error) throw error
            } else {
                // Insert (use upsert to prevent duplicate key errors)
                const { error } = await supabase
                    .from('payment_history')
                    .upsert({
                        user_id: user.id,
                        record_id: recordId,
                        payment_date: date
                    }, { onConflict: 'record_id, payment_date' })

                if (error) throw error
            }
        } catch (err) {
            console.error('Failed to toggle payment:', err)
            // Revert on error
            fetchHistory()
        }
    }, [user, supabase, fetchHistory])

    return {
        completedPayments,
        isLoading,
        togglePayment,
        refetch: fetchHistory
    }
}
