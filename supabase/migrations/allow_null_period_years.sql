-- records.period_years를 NULL 허용으로 변경
-- 목적: 목표 기간 없이 "그냥 꾸준히 적립" 하는 습관형(Habit Mode) 투자 수용
--
-- 기존 사용자 데이터(목표 기간이 있는 투자)는 변경되지 않음.
-- period_years = NULL 또는 0 인 레코드는 앱에서 적립형(Habit Mode)으로 취급한다.

ALTER TABLE records
ALTER COLUMN period_years DROP NOT NULL;
