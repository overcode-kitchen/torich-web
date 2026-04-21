-- records 테이블에 market 컬럼 추가 (미국/한국 시장 구분)
ALTER TABLE records
ADD COLUMN IF NOT EXISTS market TEXT CHECK (market IN ('KR', 'US')) DEFAULT NULL;
