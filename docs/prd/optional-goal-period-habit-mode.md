# PRD: 목표 기간 선택제 — 목표형 / 적립형 투자 모드

| 항목 | 내용 |
|------|------|
| **기능명** | 목표 기간 선택제 (Goal Mode / Habit Mode) |
| **우선순위** | P1 |
| **한 줄 설명** | 목표 기간 없이 그냥 적립하는 사용자도 수용할 수 있도록 투자 모드를 두 가지로 분리 |
| **버전** | 1.0 |
| **작성일** | 2026-04-21 |

---

## 1. 배경 및 문제 정의

### 1.1 현재 모델의 전제

```typescript
// 현재 Investment 타입
period_years: number  // 필수 정수
```

`period_years`가 없으면 `calculateEndDate`, `calculateProgress`, `remainingText` 등 앱의 모든 계산이 불가하다. 코드 내에 `|| 1`이 임시방편으로 박혀 있다.

```typescript
// useInvestmentCalculations.ts — 임시방편 흔적
const endDate = calculateEndDate(startDate, displayPeriodYears || 1);
const progress = calculateProgress(startDate, displayPeriodYears || 1);
```

### 1.2 배제되는 사용자 유형

| 타입 | 행동 | 현재 앱 대응 |
|---|---|---|
| **Goal-based (목표형)** | "10년 후 1억 모으겠다" | ✅ 지원 |
| **Habit-based (적립형)** | "그냥 매달 꾸준히 넣자" | ❌ 억지로 기간 입력 강요 |

적립형 사용자는 의미 없는 숫자를 채우고, 그 허구의 숫자가 진행률·종료일·남은 기간에 반영되어 **앱 전체가 무의미한 데이터 위에서 작동**한다.

### 1.3 타깃 사용자 분석

실제 적립 투자자 멘탈 모델:

| 질문 | 목표형 답변 | 적립형 답변 |
|---|---|---|
| 왜 투자하나? | 특정 금액/시점 달성 | 부자가 되고 싶어서, 습관 만들려고 |
| 언제까지 넣을 거야? | 2030년까지 | 모르겠어, 그냥 계속 |
| 지금 얼마나 됐어? | 목표의 40% | 3년 동안 빠짐없이 넣었어 |

현재 앱은 목표형 언어만 사용한다.

---

## 2. 해결 방향: 투자 모드 이원화

### 2.1 두 가지 모드

```
Goal Mode (목표형)
  → period_years 있음
  → 진행률 바, 종료일, 남은 기간, 부족액 표시

Habit Mode (적립형)
  → period_years null
  → 납입 streak, 누적 납입액, 복수 시뮬레이션 표시
```

### 2.2 혼재 허용

두 모드는 **투자 항목 단위**로 적용된다. 한 사용자가 목표형 투자와 적립형 투자를 동시에 가질 수 있다.

```
records 테이블 예시
─────────────────────────────────────────────
id | title          | period_years | 모드
───┼────────────────┼──────────────┼──────────
 1 | 내집마련 펀드  | 7            | 목표형
 2 | 삼성전자 ETF   | NULL         | 적립형
 3 | S&P500 ETF    | NULL         | 적립형
 4 | 아이 교육비    | 10           | 목표형
```

---

## 3. 기능 명세

### 3.1 데이터 모델 변경

```typescript
// 변경 전
period_years: number

// 변경 후
period_years: number | null
```

DB 마이그레이션:
```sql
ALTER TABLE records
ALTER COLUMN period_years DROP NOT NULL;
```

### 3.2 투자 추가 폼 (Add Investment)

기간 입력 필드에 "없음" 옵션 추가.

```
목표 기간 (선택)
─────────────────────────────
  [  5  ] 년     ← 기존 숫자 입력

  또는

  [목표 기간 없이 적립하기]  ← 새로운 선택지
```

UX 흐름:
- 기간 입력 필드 하단에 "목표 기간이 없으신가요?" 텍스트 링크
- 탭 시 period_years를 null로 설정하고 기간 입력 필드 비활성화

### 3.3 투자 카드 (홈 화면)

모드에 따라 카드 레이아웃이 달라진다.

**목표형 카드 (기존)**
```
┌─────────────────────────────────────┐
│ 내집마련 펀드            매월 50만원 │
│ ████████░░ 78%                      │
│ 2031년까지 · 6년 2개월 남음         │
└─────────────────────────────────────┘
```

**적립형 카드 (신규)**
```
┌─────────────────────────────────────┐
│ 삼성전자 ETF             매월 30만원 │
│ 🔥 14개월째 적립 중                 │
│ 현재 예상 자산 4,487,320원          │
└─────────────────────────────────────┘
```

### 3.4 투자 상세 화면

#### 목표형 (기존 화면 유지)

- 진행률 바 표시
- 시작일 / 종료일
- 남은 기간
- 목표 금액 / 예상 달성액 / 부족액

#### 적립형 (신규 레이아웃)

**Progress 섹션 대체:**
```
14개월째 적립 중 🔥
2024년 2월부터 시작

총 납입액      4,200,000원
현재 예상 자산  4,487,320원
수익률         +6.8%
```

**시뮬레이션 섹션 (신규):**
```
계속 넣으면 얼마가 될까?
연 8.0% 수익률 기준

 5년 후   약 2,200만원
10년 후   약 5,500만원
20년 후   약 1억 7,000만원

목표 기간을 설정하면 더 정확히 볼 수 있어요 →
```

> 시뮬레이션은 현재 `monthly_amount`와 `annual_rate`로 계산.
> 하단 CTA를 통해 Goal Mode로 전환 가능.

### 3.5 정보 섹션 (InfoSection) 변경

| 항목 | 목표형 | 적립형 |
|---|---|---|
| 목표 기간 | "7년" | "없음 (적립 중)" |
| 종료일 | "2031년 3월" | 미표시 |
| 남은 기간 | "6년 2개월 남음" | 미표시 |
| 납입 기간 | 미표시 | "14개월째" |

### 3.6 모드 전환

적립형 → 목표형 전환:
- 상세 화면 또는 시뮬레이션 섹션 CTA에서 기간 입력
- period_years 저장 → 즉시 Goal Mode로 전환

목표형 → 적립형 전환:
- 수정 화면에서 기간 필드를 "없음"으로 변경
- period_years = null 저장

---

## 4. 통계 화면 (Stats) 대응

목표형 + 적립형이 혼재할 때 집계 방식.

### 4.1 전체 요약 (모드 무관)

```
총 납입액         12,400,000원   ← 전체 합산
예상 총 자산      14,230,000원   ← 전체 합산
이번 달 납입률    100% ✓         ← 전체 납입 완료 여부
```

### 4.2 목표형 투자 요약 (별도 섹션)

```
목표형 투자 (2개)
평균 진행률   42%
달성 예정     2031년 내집마련 펀드
```

### 4.3 적립형 투자 요약 (별도 섹션)

```
적립형 투자 (2개)
평균 납입 기간   11개월
연속 납입 최장   6개월 (삼성전자 ETF)
```

---

## 5. 엣지 케이스

| 케이스 | 처리 방법 |
|---|---|
| 기존 사용자 데이터 (period_years 있음) | 변경 없음, 모두 목표형으로 유지 |
| period_years = 0 | null 처리와 동일하게 적립형으로 간주 |
| 적립형에서 수익률 미설정 | 기본 수익률(8%) 또는 마켓 평균으로 시뮬레이션 |
| 통계 화면 평균 진행률 계산 | 목표형 투자만 포함, 적립형 제외 |

---

## 6. 영향 받는 파일

| 파일 | 변경 내용 |
|---|---|
| `app/types/investment.ts` | `period_years: number` → `number \| null` |
| `app/utils/date.ts` | `calculateEndDate`, `calculateProgress` 등 null guard 추가 |
| `app/hooks/investment/calculations/useInvestmentCalculations.ts` | nullable 타입 처리 |
| `app/hooks/investment/add/useAddInvestmentCalculations.ts` | 기간 미입력 허용 |
| `app/components/InvestmentDetailSections/ProgressSection.tsx` | 적립형 뷰 분기 렌더링 |
| `app/components/InvestmentDetailSections/InfoSection.tsx` | period_years null 처리 |
| `app/components/AddInvestmentSections/PeriodInput.tsx` | "없음" 선택 옵션 추가 |
| `app/hooks/investment/calculations/useStatsCalculations.ts` | 목표형/적립형 분리 집계 |
| `supabase/migrations/*.sql` | `period_years` NOT NULL 해제 |

---

## 7. 구현 단계

```
1단계: 데이터 모델 (DB + 타입)
  → records.period_years NOT NULL 해제
  → Investment 타입 period_years: number | null

2단계: 유틸 함수 null guard
  → date.ts 계산 함수들 — null 시 null 반환
  → useInvestmentCalculations.ts nullable 처리

3단계: 투자 추가 폼
  → PeriodInput에 "목표 기간 없이 적립하기" 옵션
  → 적립형 선택 시 period = null 저장

4단계: 카드 + 상세 UI 분기
  → 홈 카드: 적립형 레이아웃
  → 상세 Progress섹션: 적립형 뷰 (streak + 누적액)
  → 상세 시뮬레이션 섹션 신규 추가

5단계: 통계 화면 분리 집계
  → 목표형 / 적립형 별도 섹션
  → 기존 평균 진행률은 목표형만 포함
```

---

## 8. 성공 지표

| 지표 | 목표 |
|---|---|
| 적립형으로 등록된 투자 비율 | 전체의 30% 이상 |
| 기간 입력 없이 등록 완료율 | 목표형 대비 이탈률 감소 |
| 목표형 전환율 | 적립형 등록 후 30일 이내 30% 이상이 목표 기간 설정 |
