-- 적금/예금 만기 수령이 묶인 목적에 반영된 시각을 기록한다.
-- - NULL: 아직 만기 안 됐거나, 만기됐어도 정산 처리 전
-- - timestamptz: 정산 처리 시각 (자동 또는 수동)
-- 구버전 클라이언트가 이 컬럼을 모르고 조회해도 동작에 영향 없도록 nullable + default null.
-- 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md

ALTER TABLE records
  ADD COLUMN IF NOT EXISTS settled_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN records.settled_at IS
  '예적금 만기 후 묶인 목적에 수령액이 반영된 시각. 미정산이면 null.';

-- 미정산 + 만기 보유 record 빠른 조회를 위한 부분 인덱스.
-- 앱 진입 시 "정산 처리 대상" 후보를 효율적으로 찾기 위함.
CREATE INDEX IF NOT EXISTS idx_records_unsettled_with_maturity
  ON records (maturity_date)
  WHERE settled_at IS NULL AND maturity_date IS NOT NULL;
