# 티끌모아 태산 (Tickle Moa) - Product Requirements Document (PRD)

> **버전**: 1.0  
> **최종 수정일**: 2025-01-15  
> **작성 기준**: 현재 코드베이스 분석

---

## 1. 서비스 개요

### 1.1 서비스명
- **앱 내부명**: 티끌모아 태산
- **랜딩 브랜드**: 토리치 (비로그인 시)
- **캐릭터**: 토리 (🐿️ 다람쥐)

### 1.2 한 줄 요약
**매달 꾸준히 적립 투자했을 때, N년 뒤 얼마가 될지 복리로 계산해 보여주는 개인 투자 시뮬레이터**

### 1.3 핵심 가치 제안
- 막연한 부자의 꿈을 **숫자로 확인**
- **10초 만에** 복리 계산 결과 확인
- **현실적인 자산 목표** 제시 (희망 고문 지양)

---

## 2. 타깃 사용자

- 월급의 일부를 꾸준히 적립·투자하는 직장인
- 복리 효과를 직관적으로 이해하고 싶은 사람
- 여러 투자(주식, ETF 등)를 한 곳에서 관리하고 싶은 사람

---

## 3. 핵심 기능

### 3.1 투자 등록 (Add Investment)

| 항목 | 설명 |
|------|------|
| **진입 경로** | 랜딩 → "계산기 두드려보기" / 로그인 후 → "투자 목록 추가하기" |
| **종목 입력** | 검색(국내/미국 주식) 또는 직접 입력 |
| **마켓** | 🇰🇷 국내 주식(KR) / 🇺🇸 미국 주식(US) |
| **검색** | 2글자 이상 입력 시 Debounce(500ms) 후 API 검색, `stocks` 테이블 기반 |
| **직접 입력** | 검색 결과 없을 때 "직접 입력하기" → 종목명 + 예상 수익률 입력 |
| **수익률** | 검색 선택 시 Yahoo Finance 10년 CAGR 자동 적용, 직접 입력 시 사용자 입력값 |
| **수익률 상한** | CAGR 최대 20% (워렌 버핏 수준, 희망 고문 방지) |
| **입력 필드** | 월 투자금(만원), 투자 기간(년), 투자 시작일, 매월 투자일(선택) |
| **저장** | Supabase `records` 테이블에 `user_id`와 함께 저장 |

### 3.2 대시보드 (메인 화면)

| 영역 | 설명 |
|------|------|
| **상단 배너** | 2장 가로 스크롤, 페이지네이션 점 |
| **배너 1** | 예상 자산 (N년 뒤 선택: 1/3/5/10/30년) |
| **배너 2** | 임시 플레이스홀더 |
| **만기 안내** | 선택 기간 > 개별 투자 만기 시 "만기된 상품은 현금 보관" 안내 → 클릭 시 CashHoldItemsSheet |
| **월 납입 pill** | "월 X만원씩 심는 중" → 클릭 시 MonthlyContributionSheet |
| **투자 목록 추가** | CTA 버튼 → `/add` |
| **예상 수익 차트** | 스택형 막대 차트 (원금 vs 수익 The Gap) |
| **투자 목록** | 필터(전체/진행 중/종료) + 정렬(평가금액/월 투자액/이름) |

### 3.3 투자 상세·수정 (InvestmentDetailView)

| 항목 | 설명 |
|------|------|
| **진입** | 목록 아이템 클릭 |
| **표시** | 월 투자금, 목표 기간, 연 수익률, 매월 투자일, 만기 예상 금액, 진행률 |
| **수정** | DropdownMenu(연필/휴지통) → 수정 모드 전환 |
| **수익률** | 10년 평균 제안 칩(InvestmentEditSheet) 또는 직접 입력 |
| **매월 투자일** | InvestmentDaysPickerSheet(바텀시트)로 다중 선택 |
| **저장/삭제** | Supabase `records` 업데이트/삭제 |

### 3.4 바텀 시트

| 시트 | 트리거 | 내용 |
|------|--------|------|
| **CashHoldItemsSheet** | "만기된 상품은 현금 보관" 클릭 | 선택 기간보다 만기가 짧은 항목 목록, 만기 시점 평가금액 |
| **MonthlyContributionSheet** | "월 X만원씩 심는 중" 클릭 | 총 월 납입액, 종목별 금액·비중 |
| **InvestmentDaysPickerSheet** | 상세 화면 "매월 투자일" + 추가 | 1~31일 그리드, 다중 선택 |

### 3.5 예상 수익 차트 (AssetGrowthChart)

| 항목 | 설명 |
|------|------|
| **타입** | 스택형 막대 차트 (Recharts BarChart) |
| **X축** | 마일스톤 시점 (1년 후, 3년 후, 5년 후, 10년 후, 최종 만기) |
| **막대** | 하단 원금(green-200) + 상단 수익(브랜드 그린 그라데이션) |
| **라벨** | 막대 상단 총 자산, 수익 영역 내부 +수익금 |
| **인터랙션** | 막대 클릭 → 하단 상세(원금, 수익, 수익률%), 호버 툴팁 |
| **토리 메시지** | "숨만 쉬었는데 {수익금}이 더 생겼어요! 💚" |

---

## 4. 인증·데이터

### 4.1 인증
- **Google OAuth** (Supabase Auth)
- **테스트 계정** (개발 환경): `test@test.com` / `password1234`
- **콜백**: `/auth/callback` → `exchangeCodeForSession` → `/`

### 4.2 데이터 저장 (Supabase)

| 테이블 | 용도 |
|--------|------|
| `records` | 투자 기록 (user_id, title, symbol, monthly_amount, period_years, annual_rate, final_amount, start_date, investment_days, is_custom_rate 등) |
| `stocks` | 종목 검색용 (symbol, name, group, market) |

### 4.3 투자 데이터 스키마 (records)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | FK (auth.users) |
| title | string | 종목명 |
| symbol | string? | Yahoo Finance 심볼 (검색 선택 시) |
| monthly_amount | number | 월 투자금(원) |
| period_years | number | 목표 기간(년) |
| annual_rate | number | 연 수익률(%) |
| final_amount | number | 만기 예상 금액 |
| start_date | date | 투자 시작일 |
| investment_days | number[]? | 매월 투자일 (예: [5, 25]) |
| is_custom_rate | boolean | 수익률 직접 입력 여부 |
| created_at | timestamp | 생성일 |

---

## 5. 핵심 계산 로직

### 5.1 복리 공식 (기납입액 기준 월복리)
```
FV = PMT × ((1+r)^n - 1) / r × (1+r)
```
- PMT: 월 납입액
- r: 월 이율 (연이율/12)
- n: 총 개월 수

### 5.2 만기 이후 (Cash Hold)
- 사용자 선택 기간(T) > 개별 투자 만기(P)인 경우
- P년까지 복리로 계산 후, (T-P)년 동안 **이자 없이 현금 보관**으로 가정

### 5.3 수익률 출처
- **시스템**: Yahoo Finance 과거 10년 월봉 → CAGR 계산
- **직접 입력**: 사용자 입력값
- **안전장치**: CAGR 최대 20% 상한

---

## 6. API

| 엔드포인트 | 메서드 | 용도 |
|------------|--------|------|
| `/api/search` | GET | 종목 검색 (query, market) |
| `/api/stock` | GET | 종목 상세 (symbol) → 10년 CAGR, 현재가 |
| `/api/cron/update-rates` | GET | 수익률 일괄 갱신 (CRON_SECRET 인증) |

---

## 7. 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16, React 19 |
| 스타일 | Tailwind CSS 4 |
| DB·Auth | Supabase |
| 차트 | Recharts |
| 금융 데이터 | Yahoo Finance (yahoo-finance2) |
| UI 컴포넌트 | Radix UI (Dropdown, AlertDialog 등) |
| 아이콘 | Tabler Icons |

---

## 8. 화면 플로우

```
[랜딩] → 계산기 두드려보기 → /add (비로그인 가능)
       → 로그인 → /login → Google OAuth → /auth/callback → /

[로그인 후]
/ (대시보드)
  ├─ 배너 1: 예상 자산, 만기 안내, 월 납입 pill
  ├─ 투자 목록 추가하기 → /add
  ├─ 예상 수익 차트 (스택 막대)
  └─ 내 투자 목록
       └─ 아이템 클릭 → InvestmentDetailView (모달/풀페이지)
            ├─ 수정 → 저장
            └─ 삭제

/add (투자 추가)
  ├─ 종목 검색 (KR/US) 또는 직접 입력
  ├─ 월 투자금, 기간, 시작일, 매월 투자일
  └─ 저장 → /
```

---

## 9. 톤앤매너

- **금융 용어**: 도토리, 씨앗 등 과한 은유 지양
- **스타일**: 토스·카카오뱅크 스타일의 깔끔한 UI
- **수치**: 억/만원 단위, 소수점 최소화

---

## 10. 향후 고려 사항 (코드 기반 추정)

- 배너 2 콘텐츠 확정
- CRON 수익률 갱신 스케줄 설정
- GA 이벤트 활성화 (주석 처리된 `sendGAEvent`)
- 모바일 최적화 (max-w-md 기준)
