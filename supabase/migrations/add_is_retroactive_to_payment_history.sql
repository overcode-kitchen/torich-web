-- payment_history 테이블에 is_retroactive 컬럼 추가
-- 앱 등록(records.created_at) 이전 기간의 납입을 사용자가 소급 입력할 수 있도록 구분하기 위함
-- 참고: PRD docs/prd/past-start-date-and-retroactive-payments.md

ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS is_retroactive BOOLEAN NOT NULL DEFAULT false;

-- 소급 기록은 월 단위로만 존재 (payment_date = YYYY-MM-01로 저장).
-- 기존 unique (record_id, payment_date) 제약과 공존할 수 있도록
-- is_retroactive도 키에 포함되는 부분 unique index를 별도로 생성한다.
-- 자동 추적 레코드(day=1, is_retroactive=false)와의 충돌은
-- 소급 구간이 created_at 이전이라는 전제 상 자연스럽게 회피된다.
CREATE UNIQUE INDEX IF NOT EXISTS payment_history_retro_unique_idx
ON payment_history (record_id, payment_date)
WHERE is_retroactive = true;

-- 조회 최적화
CREATE INDEX IF NOT EXISTS payment_history_record_retro_idx
ON payment_history (record_id, is_retroactive);
