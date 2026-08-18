import type { Investment } from '@/app/types/investment'
import { shortWon } from '@/app/utils/goal-format'

/**
 * 완료·취소 토스트 문구를 한 곳에서 조립한다.
 *
 * 배경: 세 호출부(usePaymentCompletion · useMonthlyPaymentStatus · useMonthToggleUndo)가
 * 각자 `완료됨` / `적립 완료됨` 식으로 문구를 만들어, 무엇이 바뀌었는지 안 드러나고 표현도 갈렸다.
 * 여기로 모아 "어떤 항목의 무엇이 완료/취소됐는지"를 한 규칙으로 만든다. (이슈 #196)
 *
 * 문구는 `{이름} {대상} {완료|취소}` 꼴이다.
 * - 이름: 적립 항목 이름(`title`). 길면 말줄임한다(아래 TITLE_MAX).
 * - 대상: 무엇을 좁히는 한 조각 — 금액(`50만원`)·회차(`10일 회차`)·월(`8월`) 중 자리에 맞는 것. 없으면 생략.
 * - 토스트는 [본문(min-w-0 flex-1)] + [되돌리기(shrink-0)] 구조라 본문이 길어도 버튼을 밀어내지 않는다.
 *   본문만 여러 줄로 접히므로, 말줄임은 이름이 과하게 길 때 줄 수가 불어나는 것을 막는 용도다.
 */

/** 이름 말줄임 기준(자). 이보다 길면 끝을 `…`로 접는다. */
const TITLE_MAX = 16

function clampTitle(title: string): string {
  const t = title.trim()
  return t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX - 1)}…` : t
}

/**
 * 대상을 좁히는 금액/주수 축약 표기.
 * - 주수 모드: `3주`
 * - 금액 모드: `shortWon`으로 만원 단위 축약(`50만원`)
 * 필드명이 다른 두 출처(Investment / PaymentEvent)를 모두 받도록 값만 넘겨받는다.
 */
export function paymentAmountLabel(params: {
  unitType?: 'amount' | 'shares' | null
  monthlyShares?: number | null
  monthlyAmount: number
}): string {
  if (params.unitType === 'shares' && params.monthlyShares && params.monthlyShares > 0) {
    return `${params.monthlyShares}주`
  }
  return shortWon(params.monthlyAmount)
}

/** Investment 레코드에서 금액/주수 표기를 뽑는 편의 래퍼. */
export function paymentAmountLabelFromRecord(
  record: Pick<Investment, 'unit_type' | 'monthly_shares' | 'monthly_amount'>,
): string {
  return paymentAmountLabel({
    unitType: record.unit_type,
    monthlyShares: record.monthly_shares,
    monthlyAmount: record.monthly_amount,
  })
}

export type PaymentToastKind = 'completed' | 'canceled'

/**
 * 완료/취소 토스트 문구.
 * @param title  적립 항목 이름
 * @param detail 대상을 좁히는 한 조각(금액·회차·월). 없으면 생략.
 * @param kind   완료면 `완료`, 취소면 `취소`
 */
export function paymentToastMessage(
  title: string,
  detail: string | null | undefined,
  kind: PaymentToastKind,
): string {
  const name = clampTitle(title)
  const suffix = kind === 'completed' ? '완료' : '취소'
  return detail ? `${name} ${detail} ${suffix}` : `${name} ${suffix}`
}
