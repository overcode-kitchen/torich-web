-- records 테이블에 적립 항목 유형(투자/예적금/현금) 컬럼 추가
-- 참고 spec: .omc/specs/savings-cash-record-types.md
--
-- 호환성:
-- - 기존 행은 record_type='investment'로 자동 채워져 기존 투자와 동일하게 동작
-- - interest_rate / maturity_date는 NULL 허용 (예적금 유형에서만 값 사용)
-- - 구버전 앱은 새 컬럼을 모르고도 정상 동작 (Breaking Change 0)

ALTER TABLE records
ADD COLUMN IF NOT EXISTS record_type TEXT NOT NULL DEFAULT 'investment'
  CHECK (record_type IN ('investment', 'savings', 'cash'));

ALTER TABLE records
ADD COLUMN IF NOT EXISTS interest_rate NUMERIC DEFAULT NULL;

ALTER TABLE records
ADD COLUMN IF NOT EXISTS maturity_date DATE DEFAULT NULL;
