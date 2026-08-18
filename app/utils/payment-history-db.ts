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
    /** 매수 시점 캡처 주수 (자동 추적만 채움. 소급은 NULL) */
    capturedShares?: number | null
    /** 매수 시점 캡처 1주 시세, 원화 (4단계 fallback 다 실패 시 NULL) */
    capturedPrice?: number | null
  }
) {
  const {
    userId,
    recordId,
    paymentDate,
    isRetroactive,
    shouldDelete,
    capturedShares,
    capturedPrice,
  } = params

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
      captured_shares: capturedShares ?? null,
      captured_price: capturedPrice ?? null,
    },
    { onConflict: 'record_id, payment_date', ignoreDuplicates: isRetroactive }
  )
  if (error) throw error
}

/**
 * 이미 저장된 자동 추적 행에 매수 시점 시세만 뒤늦게 채운다.
 *
 * 체크 저장이 시세 조회를 기다리지 않도록 두 단계로 나눈 결과다. 1단계에서 captured_* 없이
 * 행을 확정하고, 시세가 도착하면 이 함수로 그 두 컬럼만 갱신한다.
 * 사용자가 곧바로 완료를 취소해 행이 사라졌다면 갱신 대상이 없어 조용히 끝난다.
 */
export async function updatePaymentCapturedPrice(
  supabase: SupabaseClient,
  params: {
    userId: string
    recordId: string
    paymentDate: string
    capturedShares: number | null
    capturedPrice: number | null
  }
) {
  const { error } = await supabase
    .from('payment_history')
    .update({
      captured_shares: params.capturedShares,
      captured_price: params.capturedPrice,
    })
    .eq('user_id', params.userId)
    .eq('record_id', params.recordId)
    .eq('payment_date', params.paymentDate)
    .eq('is_retroactive', false)
  if (error) throw error
}

/**
 * 소급(앱 등록 이전) 구간의 여러 월을 한 번의 upsert로 완료 처리한다.
 * 이미 기록된 월은 ignoreDuplicates 로 자동 스킵된다.
 */
export async function bulkUpsertRetroactiveRows(
  supabase: SupabaseClient,
  params: {
    userId: string
    recordId: string
    yearMonths: string[]
  }
) {
  if (params.yearMonths.length === 0) return
  const rows = params.yearMonths.map((ym) => ({
    user_id: params.userId,
    record_id: params.recordId,
    payment_date: `${ym}-01`,
    is_retroactive: true,
  }))
  const { error } = await supabase
    .from('payment_history')
    .upsert(rows, { onConflict: 'record_id, payment_date', ignoreDuplicates: true })
  if (error) throw error
}
