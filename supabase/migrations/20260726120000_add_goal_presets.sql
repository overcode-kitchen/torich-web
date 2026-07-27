-- 목적 추천 칩(프리셋) 원격화 (#75)
-- 안전성: 신규 테이블만 추가. 기존 스키마 무변경.
-- 구버전 앱은 이 테이블을 모르므로 앱 내장 GOAL_PRESETS 상수를 그대로 사용(동작 변화 없음).

-- 1. goal_presets 신규 테이블
--    icon_key: 앱 내장 PURPOSE_ICONS의 key를 참조(이미지 자체는 원격화하지 않음).
--    display_from/display_to: 기간 노출용(NULL이면 상시 노출).
CREATE TABLE IF NOT EXISTS goal_presets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  icon_key     text NOT NULL,
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  display_from timestamptz,
  display_to   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_presets_active
  ON goal_presets(is_active, sort_order);

-- 2. RLS: 인증 사용자 SELECT만 허용. 쓰기는 서비스 롤(RLS 우회)로만.
ALTER TABLE goal_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view goal presets"
  ON goal_presets FOR SELECT
  TO authenticated
  USING (true);

-- 3. 현재 앱 내장 프리셋을 기본 시드로 넣는다(테이블이 비어 있을 때만).
--    → 마이그레이션 직후 원격 목록 == 상수 목록이라 동작 변화가 없다.
INSERT INTO goal_presets (name, icon_key, sort_order)
SELECT * FROM (
  VALUES
    ('결혼 자금', 'ring', 0),
    ('주택 자금', 'house', 1),
    ('여행', 'airplane', 2),
    ('차', 'car', 3),
    ('이사', 'box', 4)
) AS seed(name, icon_key, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM goal_presets);
