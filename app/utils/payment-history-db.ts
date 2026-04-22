import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * payment_history row upsert/delete 헬퍼
 * - 자동 추적 (is_retroactive=false): payment_date는 YYYY-MM-DD
 * - 소급 기록 (is_retroactive=true): payment_date는 YYYY-MM-01 (월 단위)
 */
export async function writePaymentHistoryRow(
  supabase: SupabaseClient,
  params: {
    userId: string
    recordId: string
    paymentDate: string
    isRetroactive: boolean
    shouldDelete: boolean
  }
) {
  const { userId, recordId, paymentDate, isRetroactive, shouldDelete } = params

  if (shouldDelete) {
    const { error } = await supabase
      .from('payment_history')
      .delete()
      .eq('user_id', userId)
      .eq('is_retroactive', isRetroactive)
      .match({ record_id: recordId, payment_date: paymentDate })
    if (error) throw error
    return
  }

  const { error } = await supabase.from('payment_history').upsert(
    {
      user_id: userId,
      record_id: recordId,
      payment_date: paymentDate,
      is_retroactive: isRetroactive,
    },
    { onConflict: 'record_id, payment_date', ignoreDuplicates: isRetroactive }
  )
  if (error) throw error
}
