# 통계(Stats) 탭 — 이행 중심 재설계 구현 계획

> 이 문서는 **단독 실행 가능한 작업 명세**다. 대화 히스토리 없이 이 문서만으로 구현할 수 있도록 작성됐다.
> 대상 저장소: `torich-web` (Next.js 16 / React 19 / TypeScript / Tailwind v4 / Supabase / Capacitor iOS)

---

## 0. 배경 — 왜 바꾸는가

**토리치는 "자산관리 앱"이 아니라 "투자 습관·약속 이행 트래커"다.**
- 슬로건: *"매달 투자, 까먹지 않게"* (README.md)
- 핵심 가치 = *이번 달 투자를 했는가 / 꾸준히 하고 있는가*(이행/완료)
- 부차 가치 = 얼마 모였는가(금액/자산)

**현재 통계탭의 문제 (Root Cause):**
1. **취지 불일치** — 화면 최상단 주인공이 "지금까지 모은 원금"(금액)이라 자산 대시보드처럼 읽힘. 정작 핵심 지표인 완료율 차트는 맨 아래.
2. **정보 위계 없음** — 5개 카드가 동등한 무게로 세로 나열. "가장 중요한 1개"가 없어 가독성 저하.
3. **개념 파편화** — 겹치는 이행 정보(이번달 납입 / 모은 원금 / 완료율 / 모드요약)가 4개 카드로 분산.
4. **시각 단조** — 차트가 회색 단색 + 의미 없는 투명도 그라데이션.

**목표:** 완료율(이행률)을 주인공으로 끌어올리고, 자산은 톤다운, 섹션 5개→3개로 묶어 위계를 세운다.

---

## 1. 현재 구조 (As-Is) — 파일 인벤토리

**페이지 / 뷰**
- `app/stats/page.tsx` (~101줄) — 훅 조합 + `StatsView`에 props 전달
- `app/components/StatsSections/StatsView.tsx` (~143줄) — 앱바 + 레이아웃 + `StatsContent`
- `app/components/StatsSections/StatsContent.tsx` (~122줄) — **섹션 순서/조건부 렌더 관리 (이 파일이 핵심 재구성 대상)**
- `app/components/StatsSections/StatsHeader.tsx` (~7줄) — "통계" 제목

**섹션 컴포넌트 (현재 렌더 순서)**
1. `StatsGoalProgressSection.tsx` (~83줄) — 활성 목표 진척 리스트
2. `ExpectedAssetSection.tsx` (~33줄) — 지금까지 모은 원금 + "월 OOO씩 적립 중" 버튼 (`hasRecords` 시)
3. `MonthlyStatusSection.tsx` (~52줄) — 이번 달 납입 현황(완료/전체 + 진행바 + 지난달 대비)
4. `ModeBreakdownSection.tsx` (~96줄) — 목표형/적립형 혼재 시 요약 (`hasRecords` 시)
5. `CompletionRateSection.tsx` (~92줄) — 기간 필터 + 완료율 % + 월별 Recharts 막대차트
- `MonthlyContributionSheet.tsx` (~103줄) — 월별 투자내역 바텀시트 (ExpectedAsset 버튼이 트리거)

**훅 (계산/데이터 — 재사용, 변경 최소)**
- `app/hooks/investment/data/useStatsData.ts` — records/activeRecords 로드
- `app/hooks/investment/calculations/useStatsCalculations.ts` (~168줄) — `totalPaidPrincipal`, `totalMonthlyPayment`, `thisMonth{totalPayment,completedPayment,progress,remainingPayment}`, `goalStats`, `habitStats`
- `app/hooks/chart/useChartData.ts` (~72줄) — `periodCompletionRate`, `chartData[]`, `chartBarColor`
- `app/hooks/stats/usePeriodFilter.ts` — `periodPreset`, `periodLabel`, `customDateRange`, `effectiveMonths`
- `app/hooks/investment/calculations/useMonthlyContribution.ts` — 바텀시트용 항목
- `app/utils/stats.ts` — `getMonthlyPaymentDelta(...)` (지난달 대비, **금액(원) 기준**)

**현재 차트 색 처리 (`CompletionRateSection.tsx`):**
```tsx
{chartData.map((_, i) => (
  <Cell key={i} fill={chartBarColor} fillOpacity={0.7 + (i / chartData.length) * 0.3} />
))}
```
→ 단색 + 인덱스 비례 투명도(장식). 데이터 의미 없음.

---

## 2. 목표 구조 (To-Be)

```
[통계]  ← 헤더

┌─ ① 이행 현황 HERO ─────────────────────┐   ← 주인공 (신규 컴포넌트)
│  "이번 달 이행"            [최근 6개월 ▼] │
│   88%   ↗ 지난달 +13%p                   │
│   35만원 / 40만원 · 남은 5만원            │
│   ▓▓▓▓▓▓▓▓░░ (진행바)                    │
│   ▁▂▃▅▄█  (월별 추세, 현재 달만 강조색)   │
└────────────────────────────────────────┘

┌─ ② 목표 · 진척 ───────────────────────┐
│  StatsGoalProgressSection (활성 목표)   │
│  ModeBreakdownSection (혼재 시 요약)     │
└────────────────────────────────────────┘

┌─ ③ 자산 요약 (톤다운) ─────────────────┐
│  지금까지 모은 원금  5,600,000원         │
│                      [월 40만원 ▸]      │
└────────────────────────────────────────┘

"토리치는 왜 수익률을 안 보여주나요? →"  (FAQ 링크 유지)
```

**핵심 변경 요약**
| 영역 | As-Is | To-Be |
|---|---|---|
| 최상단 | 모은 원금(금액) | **이번 달 이행률 %** + 진행바 + 추세차트 통합 Hero |
| 차트 색 | 단색+투명도 그라데이션 | 현재 달 강조색 / 과거 중립 회색 |
| 지난달 대비 | 맨 밑 작은 텍스트 | Hero 안 강조 |
| 목표진척+모드요약 | 떨어진 2카드 | "목표·진척" 한 묶음 |
| 모은 원금 | 상단 주인공 | **맨 아래 보조 카드** |
| 섹션 수 | 5 | **3** |

---

## 3. 구현 단계 (Phase)

### Phase 0 — 사전 점검 (착수 전 필수)
- [ ] 다음 컴포넌트가 **통계탭 외 다른 화면에서 import되는지** 확인:
  ```
  grep -rn "ExpectedAssetSection\|MonthlyStatusSection\|CompletionRateSection" app/ --include=*.tsx
  ```
  - 통계탭 단독 사용이면 자유롭게 수정/통합 가능.
  - 다른 화면에서도 쓰면 → 해당 화면도 검증 대상에 포함하거나, 통합 대신 Hero에서 별도 조합.
- [ ] `useStatsCalculations`가 반환하는 `thisMonth`, `getMonthlyPaymentDelta`, `useChartData` 반환 타입을 읽어 Hero에 넘길 props 확정.

### Phase 1 — Hero 컴포넌트 신규 생성
**파일:** `app/components/StatsSections/MonthlyComplianceHeroSection.tsx` (신규, 150줄 이내)

**책임:** 이번 달 이행률을 주인공으로 한 단일 카드. 아래를 한 컴포넌트에 조합:
- 상단: 라벨("이번 달 이행") + 기간 필터 드롭다운 (기존 `CompletionRateSection`의 필터 마크업 이전)
- 대형 숫자: 이번 달 이행률 % (또는 §5에서 정한 지표)
- 지난달 대비 배지 (§5에서 단위 결정)
- 보조 텍스트: `completedPayment / totalPayment · 남은 remainingPayment` (기존 `MonthlyStatusSection` 데이터)
- 진행바: `thisMonth.progress`
- 추세 차트: 기존 `CompletionRateSection`의 Recharts `BarChart` 이전, **색 위계 적용**

**Props 형태(예시):**
```ts
interface MonthlyComplianceHeroSectionProps {
  thisMonth: { totalPayment: number; completedPayment: number; progress: number; remainingPayment: number }
  delta?: { deltaAmount: number; hasComparison: boolean }   // 또는 rate delta (§5)
  // 기간 필터
  periodPreset: PeriodPreset
  setPeriodPreset: (p: PeriodPreset) => void
  periodLabel: string
  customDateRange: DateRange | undefined
  setCustomDateRange: (r: DateRange | undefined) => void
  handleCustomPeriod: () => void
  // 차트
  periodCompletionRate: number
  chartData: Array<{ name: string; rate: number; completed: number; total: number }>
  chartBarColor: string
}
```

### Phase 2 — 차트 색 위계 적용
**파일:** `MonthlyComplianceHeroSection.tsx`(이전한 차트) 또는 `app/hooks/chart/useChartData.ts`

- 현재 달(차트 마지막 항목, 역순 정렬이므로 가장 오른쪽)만 **강조색**, 나머지는 **중립 회색**.
- 강조색은 semantic 토큰만 사용(예: `--primary` / `--foreground` 계열). **하드코딩 hex 금지.**
- 구현 옵션:
  - (A) 컴포넌트에서 `index === chartData.length - 1`일 때 다른 `fill` 적용.
  - (B) `useChartData`가 강조 인덱스/색을 함께 반환.
- 기존 `fillOpacity={0.7 + (i/len)*0.3}` 그라데이션 제거.

### Phase 3 — StatsContent 재구성
**파일:** `app/components/StatsSections/StatsContent.tsx`

- 렌더 순서를 To-Be(§2)로 교체:
  1. `<MonthlyComplianceHeroSection ... />` (항상 표시, 빈 상태 처리 §5)
  2. 목표·진척 그룹: `<StatsGoalProgressSection />` + `<ModeBreakdownSection />`(`hasRecords` 조건 유지)
  3. `{hasRecords && <ExpectedAssetSection ... />}` — **맨 아래로 이동**
  4. FAQ 링크 (유지)
- `MonthlyStatusSection`, `CompletionRateSection`은 Hero로 흡수 → `StatsContent`에서 제거.
- `StatsContent` / `StatsView`의 props 인터페이스는 가능한 한 유지(데이터 흐름 동일).

### Phase 4 — 죽은 코드 정리
- Hero로 완전 흡수된 `MonthlyStatusSection.tsx`, `CompletionRateSection.tsx`는
  - Phase 0에서 **단독 사용 확인됐으면 삭제**,
  - 아니면 유지하되 통계탭에서는 미사용.
- 미사용 import 제거.

### Phase 5 — 빈 상태(투자 0건) 처리 (권장 포함)
- 현재 투자 0건이면 통계탭이 거의 백지.
- Hero를 빈 상태 카드로: "아직 투자 기록이 없어요" + 첫 투자 등록 CTA(`/add` 등 기존 경로 확인 후).
- 단, **새 동적 라우트(`[param]`) 추가 금지** — 기존 정적 경로만 사용.

---

## 4. 준수 규칙 (CLAUDE.md)
- 컴포넌트 1파일 **150줄 이내**, 데이터/계산은 훅, 컴포넌트는 props 렌더만.
- **색은 semantic 토큰만** (하드코딩 hex 금지). 다크모드 자동 대응 — `getComputedStyle`로 CSS 변수 읽는 기존 패턴 유지.
- 아이콘은 **Phosphor**(`@phosphor-icons/react`).
- shadcn/ui 컴포넌트 재사용(`DropdownMenu`, `Button`, `DateRangePicker` 등 기존 그대로).
- 커밋 컨벤션: `type(scope): 한글 설명 ~함/~음` (예: `refactor(stats): 통계탭을 이행 중심 3섹션 구조로 재설계함`).

---

## 5. 착수 전 확정할 결정사항
1. **Hero 주인공 숫자**: `이번 달 이행률 %`(추천) vs `기간 누적 완료율 %`(`periodCompletionRate`).
2. **"지난달 대비" 단위**:
   - 금액(원) — 기존 `getMonthlyPaymentDelta` 그대로, 추가 작업 0.
   - 완료율(%p) — `useChartData`에 rate delta 계산 소량 추가 필요.
3. **빈 상태 처리 범위**: 이번 작업에 포함할지(Phase 5) vs 후속 작업으로 분리할지.

---

## 6. 영향 반경 / 사이드 이펙트
- **운영 앱 호환성**: ✅ 안전 — 순수 프론트 UI 재배치. 구버전 iOS 앱(구코드+신DB) 영향 없음.
- **Supabase 스키마**: 해당 없음 (컬럼/테이블/RLS 변경 없음).
- **API Route**: 해당 없음.
- **정적 라우팅**: 해당 없음 — `/stats` 정적 경로 유지, 새 `[param]` 없음, `router.push` 대상 변동 없음.
- **공유 컴포넌트**: Phase 0 grep 결과에 따름. 통계탭 단독이면 안전.
- **Edge Function**: 해당 없음.
- **DB 타입 재생성**: 불필요(스키마 변경 없음).

---

## 7. 검증 (구현 후)
**로컬 동작 (`/stats`)**
- golden: 투자 다건 + 활성 목표 → Hero %·진행바·차트, 목표·진척, 자산요약 정상.
- empty: 투자 0건 → 빈 상태(또는 Hero 0% 처리) 깨지지 않음.
- 혼재: 목표형 + 적립형 → ModeBreakdown 노출.
- 기간 필터 변경 → 완료율 %·차트 갱신, 현재 달 강조색 유지.
- 다크모드 토글 → 색 위계/대비 정상.

**빌드**
```bash
npm run build:app
ls out/stats/index.html        # 산출물 존재 확인
```
- 빌드 실패 시 백업 잔재 복구:
  ```bash
  mv server-routes.backup/api app/api && mv server-routes.backup/auth app/auth && rm -rf server-routes.backup
  ```

**머지 전 점검**
- `capacitor.config.ts`: `server.url` 주석 처리 + `loggingBehavior: 'production'`.
- `git status`에 `app/api/*`, `app/auth/*` deleted 없음.
- `server-routes.backup/` 폴더 잔재 없음.

---

## 8. 작업 순서 한눈에
```
Phase 0  사전 grep 점검 + props 타입 확인
Phase 1  MonthlyComplianceHeroSection.tsx 신규 (이번달 이행 + 필터 + 차트 통합)
Phase 2  차트 색 위계 (현재 달 강조 / 과거 중립)
Phase 3  StatsContent 순서 재구성 (Hero → 목표·진척 → 자산요약)
Phase 4  흡수된 MonthlyStatus/CompletionRate 정리
Phase 5  (권장) 빈 상태 처리
검증     로컬 시나리오 + build:app + out/stats 확인 + 머지 전 체크리스트
```
