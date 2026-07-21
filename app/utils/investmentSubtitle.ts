import { Investment } from '@/app/types/investment'
import { formatCurrency } from '@/lib/utils'

/**
 * 적립 항목의 "현재 N원(주)씩 투자/적립 중" 한 줄 요약.
 * 상세 화면에서 금액 히어로 아래 보조 줄(context)로 쓰인다.
 * record_type이 savings/cash면 동사를 "적립"으로 바꾼다.
 */
export function formatInvestmentSubtitle(item: Investment): string | null {
  if (item.unit_type === 'shares' && item.monthly_shares) {
    return `현재 ${item.monthly_shares}주씩 투자 중`
  }
  if (item.monthly_amount > 0) {
    const verb = item.record_type === 'savings' || item.record_type === 'cash' ? '적립' : '투자'
    return `현재 ${formatCurrency(item.monthly_amount)}씩 ${verb} 중`
  }
  return null
}
