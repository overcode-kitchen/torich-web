import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 회원 탈퇴 시 public 스키마의 사용자 데이터를 제거합니다.
 * Service Role 클라이언트로 호출해야 RLS를 우회합니다.
 *
 * 순서: scheduled_notifications(record 참조) → records → 푸시/결제/설정
 */
export async function deleteUserPublicData(
  admin: SupabaseClient,
  userId: string
): Promise<{ error: Error | null }> {
  const { error: snError } = await admin
    .from('scheduled_notifications')
    .delete()
    .eq('user_id', userId)
  if (snError) {
    console.error('deleteUserPublicData scheduled_notifications:', snError)
    return { error: new Error(snError.message) }
  }

  const { error: recordsError } = await admin.from('records').delete().eq('user_id', userId)
  if (recordsError) {
    console.error('deleteUserPublicData records:', recordsError)
    return { error: new Error(recordsError.message) }
  }

  const { error: tokensError } = await admin
    .from('user_push_tokens')
    .delete()
    .eq('user_id', userId)
  if (tokensError) {
    console.error('deleteUserPublicData user_push_tokens:', tokensError)
    return { error: new Error(tokensError.message) }
  }

  const { error: paymentError } = await admin
    .from('payment_history')
    .delete()
    .eq('user_id', userId)
  if (paymentError) {
    console.error('deleteUserPublicData payment_history:', paymentError)
    return { error: new Error(paymentError.message) }
  }

  const { error: settingsError } = await admin
    .from('user_settings')
    .delete()
    .eq('user_id', userId)
  if (settingsError) {
    console.error('deleteUserPublicData user_settings:', settingsError)
    return { error: new Error(settingsError.message) }
  }

  return { error: null }
}
