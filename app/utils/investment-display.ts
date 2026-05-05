import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'

export interface MonthlyContributionLabel {
  /** 메인 표기 (예: "월 1주" 또는 "월 30만원") */
  main: string
  /** 주수 모드 보조 표기 (예: "약 82,000원"). 금액 모드는 null */
  sub: string | null
}

/**
 * 종목 카드/상세에서 사용할 "월 매수" 표기.
 * shares 모드: "월 N주" 메인 + 환산 보조
 * amount 모드: "월 N원" 메인 (기존 동일)
 */
export function formatMonthlyContribution(
  item: Pick<Investment, 'unit_type' | 'monthly_shares' | 'monthly_amount'>
): MonthlyContributionLabel {
  if (item.unit_type === 'shares' && item.monthly_shares && item.monthly_shares > 0) {
    return {
      main: `월 ${item.monthly_shares}주`,
      sub: `약 ${formatCurrency(item.monthly_amount)}`,
    }
  }
  return {
    main: `월 ${formatCurrency(item.monthly_amount)}`,
    sub: null,
  }
}

/**
 * 라벨 텍스트 (예: 종목 상세 InfoSection의 "월 투자금" / "월 매수 주수")
 */
export function formatContributionLabel(
  item: Pick<Investment, 'unit_type'>
): string {
  return item.unit_type === 'shares' ? '월 매수 주수' : '월 투자금'
}

/**
 * 값 텍스트 ("월" prefix 없는 형태). 표 셀이나 툴팁 등 prefix를 따로 두는 컨텍스트용.
 */
export function formatContributionValue(
  item: Pick<Investment, 'unit_type' | 'monthly_shares' | 'monthly_amount'>
): string {
  if (item.unit_type === 'shares' && item.monthly_shares && item.monthly_shares > 0) {
    return `${item.monthly_shares}주 (약 ${formatCurrency(item.monthly_amount)})`
  }
  return formatCurrency(item.monthly_amount)
}
