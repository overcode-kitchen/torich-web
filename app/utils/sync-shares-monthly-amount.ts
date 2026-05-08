import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 주수 모드(unit_type='shares') 종목의 records.monthly_amount를 최신 시세로 갱신한다.
 * 기존 알림/카드/통계가 monthly_amount를 직접 사용하기 때문에, stale 환산값으로 박혀
 * 부정확하게 노출되는 것을 막는다. amount 모드 종목에는 호출하지 말 것.
 */
export async function syncSharesMonthlyAmount(
  supabase: SupabaseClient,
  userId: string,
  recordId: string,
  monthlyShares: number,
  pricePerShare: number
): Promise<void> {
  if (!Number.isFinite(monthlyShares) || monthlyShares <= 0) return
  if (!Number.isFinite(pricePerShare) || pricePerShare <= 0) return
  await supabase
    .from('records')
    .update({ monthly_amount: Math.round(monthlyShares * pricePerShare) })
    .eq('id', recordId)
    .eq('user_id', userId)
}
