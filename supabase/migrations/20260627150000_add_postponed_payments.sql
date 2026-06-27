-- 납입 "미루기" 신기능
-- 안전성: 신규 테이블만 추가. 기존 테이블/컬럼/RLS 변경 없음 → 구버전 앱 호환 (Breaking Change 0).
--
-- 의도:
-- - payment_history가 "행 존재 = 완료"인 것과 대칭으로, postponed_payments는 "행 존재 = 미룸".
-- - 완료도 미완료도 아닌 제3의 상태로, 이번 회차를 체크리스트에서 치우되 기록은 남긴다.
-- - 홈 체크리스트와 캘린더가 동일한 미룸 상태를 공유해야 하므로 DB 기반.

-- 1. postponed_payments 신규 테이블
CREATE TABLE IF NOT EXISTS postponed_payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_id    uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- 같은 회차를 중복 미룸 처리하지 않도록 (user, record, date) 유일성 보장
  UNIQUE (user_id, record_id, payment_date)
);

CREATE INDEX IF NOT EXISTS idx_postponed_payments_user_id ON postponed_payments(user_id);

-- 2. postponed_payments RLS (기존 records/payment_history 패턴과 동일: auth.uid() = user_id)
ALTER TABLE postponed_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own postponed payments"
  ON postponed_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own postponed payments"
  ON postponed_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own postponed payments"
  ON postponed_payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own postponed payments"
  ON postponed_payments FOR DELETE
  USING (auth.uid() = user_id);
