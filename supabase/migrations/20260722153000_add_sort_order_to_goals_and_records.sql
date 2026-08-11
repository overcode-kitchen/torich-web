-- 목적(goals) / 적립 항목(records) 수동 드래그 순서 저장용 컬럼.
-- 안전성(운영 무중단):
--   · 신규 nullable 컬럼만 추가 → 기존 행은 NULL, 테이블 재작성/장시간 잠금 없음(Postgres 11+ 메타데이터 변경).
--   · 기존 컬럼·타입·RLS 변경 없음. 구버전 앱은 이 컬럼을 모르고, useInvestmentsUpdate의
--     화이트리스트 패턴이 무시하므로 SELECT/INSERT/UPDATE 모두 그대로 동작(구앱+신DB 안전).
--   · 정렬은 클라이언트(useGoals / useInvestmentsFetch)에서 stable sort로 적용하므로
--     DB가 sort_order로 정렬할 일이 없다 → 인덱스 불필요(잠금 유발 CREATE INDEX 생략).
--   · sort_order가 NULL인(=아직 손대지 않은) 행은 기존 정렬(마감 임박순/기존 순서) 그대로 유지.

-- 1. goals.sort_order (수동 목적 순서)
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS sort_order integer;

-- 2. records.sort_order (목적 카드 내 적립 항목 순서)
ALTER TABLE records
  ADD COLUMN IF NOT EXISTS sort_order integer;
