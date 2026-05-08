-- user_settings에 주말·공휴일 알림 보정 토글 컬럼 추가
-- 기본값 FALSE (구버전 앱·기존 사용자 영향 없음)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_skip_weekend_holiday BOOLEAN DEFAULT FALSE;
