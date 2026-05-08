-- 목적 기반 투자(Goal-Based Investing) 신기능
-- 안전성: 신규 테이블/컬럼만 추가. records 기존 컬럼·RLS 변경 없음.
-- 모든 신규 컬럼은 nullable 또는 DEFAULT가 있어 구버전 앱 호환.

-- 1. goals 신규 테이블
CREATE TABLE IF NOT EXISTS goals (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  target_amount        numeric NOT NULL,
  target_date          date,
  emoji                text,
  memo                 text,
  external_amount      numeric NOT NULL DEFAULT 0,
  completed_at         timestamptz,
  archived_at          timestamptz,
  notification_enabled boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_archived ON goals(user_id, archived_at);

-- 2. goals RLS (기존 records 패턴과 동일: auth.uid() = user_id)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- 3. records.goal_id (nullable, ON DELETE SET NULL)
-- 구버전 앱은 이 컬럼을 모르고, useInvestmentsUpdate의 validColumns 화이트리스트 패턴이
-- goal_id를 무시하므로 안전 (앱 호환성).
ALTER TABLE records
  ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_records_goal_id ON records(goal_id);

-- 4. scheduled_notifications.goal_id (Goal D-day 알림용)
-- record_id IS NULL인 Goal 알림과의 dedup을 위해 partial unique index 추가.
ALTER TABLE scheduled_notifications
  ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES goals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_goal_id
  ON scheduled_notifications(goal_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_notifications_goal_unique
  ON scheduled_notifications(goal_id, scheduled_at, token)
  WHERE goal_id IS NOT NULL AND record_id IS NULL;

-- 5. archive_goal RPC
-- SECURITY INVOKER (PostgreSQL 기본값) — RLS가 호출자 컨텍스트에서 적용되어
-- auth.uid() 수동 검증 불필요. 함수 자체가 단일 트랜잭션이라 원자성 보장.
CREATE OR REPLACE FUNCTION archive_goal(p_goal_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE goals
    SET archived_at = now(), updated_at = now()
    WHERE id = p_goal_id AND archived_at IS NULL;

  UPDATE records
    SET goal_id = NULL
    WHERE goal_id = p_goal_id;
END;
$$;
