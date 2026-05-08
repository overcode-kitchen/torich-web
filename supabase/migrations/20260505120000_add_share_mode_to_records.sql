-- records 테이블에 매수 단위(금액/주수) 모드 추가
-- 참고 spec: .omc/specs/deep-interview-n-shares-investment.md (4-1)
--
-- 호환성:
-- - 기존 행은 unit_type='amount'로 자동 채워져 기존 금액 모드와 동일하게 동작
-- - monthly_shares는 NULL 허용 (주수 모드에서만 값 사용)
-- - 구버전 앱은 새 컬럼을 모르고도 정상 동작 (Breaking Change 0)

ALTER TABLE records
ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'amount'
  CHECK (unit_type IN ('amount', 'shares'));

ALTER TABLE records
ADD COLUMN IF NOT EXISTS monthly_shares INTEGER DEFAULT NULL
  CHECK (monthly_shares IS NULL OR monthly_shares > 0);
