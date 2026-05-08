-- payment_history 테이블에 매수 시점 시세 캡처 필드 추가
-- 참고 spec: .omc/specs/deep-interview-n-shares-investment.md (4-2)
--
-- 의도:
-- - captured_shares: 그 매수의 주수. 금액 모드 매수도 (monthly_amount / captured_price)로 환산해 채움
-- - captured_price: 매수 시점 1주 시세 (원화). 4단계 fallback 다 실패한 극단 케이스에만 NULL
-- - 두 필드를 모든 매수에 채워두면 통계 공식이 모드 무관 단일화됨
--
-- 호환성:
-- - 둘 다 NULL 허용 → 기존 행 그대로 유지, 구버전 앱 동작 무변화
-- - 새 칸이라 구버전 앱이 안 읽어도 무해 (Breaking Change 0)

ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS captured_shares NUMERIC DEFAULT NULL
  CHECK (captured_shares IS NULL OR captured_shares > 0);

ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS captured_price NUMERIC DEFAULT NULL
  CHECK (captured_price IS NULL OR captured_price > 0);
