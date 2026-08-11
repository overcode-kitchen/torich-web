/**
 * 납입 기록 도메인 타입.
 *
 * 훅(usePaymentHistory)이 아니라 여기에 두는 이유: stats.ts·realized-principal.ts 같은
 * 순수 계산 유틸이 타입 하나 때문에 훅 모듈을 import 하고 있었다. 유틸 → 훅 방향의
 * 의존은 뒤집힌 것이라, 타입만 도메인 계층으로 내린다.
 */

/** recordId -> 완료 처리된 날짜 집합 (YYYY-MM-DD). 소급 기록은 항상 YYYY-MM-01. */
export type PaymentHistoryMap = Map<string, Set<string>>

/**
 * recordId -> (YYYY-MM-DD -> 그 납입 시점의 실제 납입액(원)).
 * captured_shares × captured_price 로 계산된 값이며, 캡처가 없는 옛/소급 납입은
 * 여기에 없어 호출측이 현재 monthly_amount 로 폴백한다.
 */
export type CapturedAmountsMap = Map<string, Map<string, number>>
