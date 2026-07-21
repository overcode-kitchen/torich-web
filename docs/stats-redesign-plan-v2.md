# 통계(Stats) 탭 — 2차 개선 계획 (v2)

> **👤 담당자: suni** (`develop/suni`) · 상태 업데이트: 2026-07-18
>
> **진행 현황 — Phase C만 남음:**
> - ✅ **Phase A** 수익률 링크 → 자산 섹션 아래 맥락 재배치 — 반영 완료 (`StatsContent.tsx` 자산 카드에 각주로 묶임, 0원일 때 비노출)
> - ✅ **Phase B** consistency→스트릭 교체 + 마일스톤 회전 인사이트 + 차트 막대 드릴다운 — 반영 완료 (`useChartData.currentPerfectStreak`, `MonthlyTrendSection`의 `selectedIndex` 드릴다운, `useStatsInsights`의 첫 100% 마일스톤)
> - ⬜ **Phase C** 전망 신호등 + IA '행동→결과→전망' 완성 — **미착수. 여기부터 이어받으면 됨.**
>   - 신규 `app/components/StatsSections/GoalOutlookSection.tsx`
>   - `projectedProgressPercent → 신호등 색` 임계값 매핑 (`app/utils/goal-status.ts`에 추가 또는 신규 util)
>   - `StatsContent.tsx` 섹션 순서를 '행동→결과→전망'으로 마무리
>
> 이 문서는 **단독 실행 가능한 작업 명세**다. 대화 히스토리 없이 이 문서만으로 구현할 수 있도록 작성됐다.
> 대상 저장소: `torich-web` (Next.js 16 / React 19 / TypeScript / Tailwind v4 / Supabase / Capacitor iOS)
>
> **선행 작업:** [stats-redesign-plan.md](stats-redesign-plan.md) (1차 재설계) 는 **이미 적용 완료**됐다. 이 문서(v2)는 그 결과물을 베이스라인으로 두고, 그것만으로는 부족했던 부분을 **다시 개선**하는 2차 작업이다.

---

## 0. 제품 정체성 (모든 판단의 기준)

토리치는 **"얼마 벌었나(수익률)가 아니라, 약속을 얼마나 지켰나(이행률)를 보는 앱"** 이다.
- 수익률을 의도적으로 숨김 ("왜 수익률을 안 보여주나요?" 링크 존재)
- 핵심 지표 두 가지: **이행률**(약속한 적립을 지켰는가) + **진척**(목적별로 얼마나 쌓였는가)
- 목적(결혼자금·내집마련 등) 중심으로 돈을 묶고 D-day로 동기 부여
- 톤: 비판하지 않고 부드러움 (다람쥐 마스코트, "천천히 결정해보세요")

---

## 1. 현재 상태 (As-Is) — 1차 재설계 적용 후 베이스라인

`StatsContent.tsx` 가 이미 **행동→결과** 위계로 재배치된 상태.

```
[hasComplianceData = true]   hero → trend → asset → goalProgress → status
[저데이터(false)]            goalProgress → hero → asset → status
```

| 섹션 | 컴포넌트 | 현재 내용 |
|---|---|---|
| **Hero** | `app/components/StatsSections/MonthlyComplianceHeroSection.tsx` | "이번 달 이행률 XX%", 진행바, 회전 인사이트, 100%면 "🎉 이행 완료" |
| 추세 | `app/components/StatsSections/MonthlyTrendSection.tsx` | 기간 필터 + 평균 이행률 + 꾸준함 한 줄 + 막대차트 (Hero 카드 안에 묶임) |
| 자산 | `app/components/StatsSections/ExpectedAssetSection.tsx` | "지금까지 모은 돈" (0원이면 숨김) |
| 목적 진척 | `app/components/StatsSections/StatsGoalProgressSection.tsx` | 활성 목적 + 현재액·% + D-day |
| 상태 요약 | `app/components/StatsSections/ModeBreakdownSection.tsx` | 목표형/적립형 혼재 시만 |
| 수익률 메시지 | `StatsContent.tsx` 하단 `<Link>` | **여전히 맨 아래 작은 회색 텍스트 링크** |

**핵심 데이터 훅 (재사용)**
- `app/hooks/investment/data/useStatsData.ts` — records / activeRecords
- `app/hooks/payment/usePaymentHistory.ts` — completedPayments / retroactivePayments (`Map<recordId, Set<YYYY-MM-DD>>`)
- `app/hooks/goal/data/useGoals.ts` — goals (target_date ASC)
- `app/hooks/investment/calculations/useStatsCalculations.ts` — totalPaidPrincipal, thisMonth{...}, goalStats, habitStats
- `app/hooks/chart/useChartData.ts` — monthlyRates, periodCompletionRate, chartData, consistency(activeMonths/perfectMonths/bestMonthLabel/bestRate)
- `app/hooks/goal/calculations/useGoalProgress.ts` — currentValue, **projectedValue, projectedProgressPercent**, progressPercent, dDay, isCompleted
- `app/hooks/stats/useStatsInsights.tsx` — 현재 "지난달보다 X원 더" 한 줄만 생성

---

## 2. 1차 결과의 한계 — 왜 또 바꾸는가

1차로 위계(행동→결과)는 세웠지만, **정체성을 드러내는 3가지가 비어 있다.**

1. **수익률 링크가 맥락 없이 떠 있음** — "왜 수익률을 안 보여주나"가 맨 아래 작은 회색 링크로, 어떤 정보 흐름과도 연결되지 않은 채 매달려 있음.
   - ⚠️ **다만 이걸 "상단 브랜드 배너로 격상"하는 건 기각됐다.** 탭하면 FAQ로 가는 건 본질적으로 **해명(안내)** 성격이라 최상단 주인공 자리에 두면 ⓐ 매 방문마다 방어적 톤, ⓑ 정작 이행 데이터가 밀림, ⓒ FAQ에 이미 동일 항목 3개 존재(중복)다.
   - → **정체성(선언)은 별도 배너가 아니라 Hero가 이미 체현한다** ("이번 달 이행률"이 주인공인 것 자체가 선언). 해명 링크는 **자산/금액 섹션 바로 아래**라는 의미 있는 맥락 위치로 옮긴다(A안).
2. **보상감의 공백** — 수익률(숫자가 주던 도파민)을 숨겼는데, 그 자리를 채울 **성취 장치가 없음.** 현재 칭찬은 "지난달보다 X원 더" 한 줄뿐.
   - ⚠️ **단, "뱃지 그리드"는 기각됐다.** 다채로운 뱃지는 전용 일러스트 세트가 본체인데 그 에셋을 만들 계획이 없다. Phosphor 단색 칩만 나열하면 빈약하고 토리치의 조용한 톤과 충돌한다.
   - ⚠️ **새 칭찬 줄을 '추가'하는 것도 기각.** 이미 한 화면에 이행률%·금액 delta·consistency 한 줄이 깔려 있어, 스트릭/마일스톤을 더하면 칭찬 4중첩이 된다. → **추가가 아니라 기존 자리를 더 의미 있는 표현으로 '교체'한다.**
3. **시간축이 '과거~현재'에서 멈춤** — 행동→결과까지는 있으나 **전망(미래)** 위계가 없어 D-day 동기부여가 통계에서 약함.

**v2 목표:** ① 수익률 링크를 **자산 섹션 아래 맥락 위치로 재배치**(정체성 선언은 Hero가 체현), ② **꾸준함 스트릭·뱃지**로 보상감 대체, ③ **전망 신호등**을 추가해 IA를 "행동→결과→전망"으로 완성.

---

## 3. 우선순위 항목 분류 (데이터 가용성 기준)

🟢 바로 가능(UI만) / 🟡 데이터·계산 추가 / 🔴 구조 변경

| # | 항목 | 분류 | 근거 |
|---|---|---|---|
| 1 | IA 재구성(행동→결과→전망) | 🟢 | 골격 완료. '전망' 묶음만 추가 재배치 |
| 2 | 수익률 메시지 격상(상단 배너) | 🟢 | 순수 UI. 데이터 0 |
| 3 | 꾸준함 스트릭·뱃지 | 🟡 | **월별 스트릭**은 `monthlyRates`로 파생 가능. 일별·영속화는 추가 |
| 4 | 놓친 항목→'완료하기' 연결 | 🟡→🔴 | 미완료 목록은 있음. 통계↔캘린더 토글 호출 배선 필요 |
| 5 | 주의 목적 우선 노출 | 🟢 | `useGoalProgress`에 D-day·진척 있음. 정렬/필터만 |
| 6 | 월별 추세 차트 개선 | 🟢 | `chartData.rate` 있음. 목표선·미달 강조는 렌더만 |
| 7 | 누적 적립 곡선 | 🟡 | 누적이 현재 스칼라뿐. 시계열 생성 함수 신규 |
| 8 | 목표 전망 신호등 | 🟡(저가) | `projectedProgressPercent` 이미 계산됨 → 임계값→색 매핑만 |
| 9 | 투자요약 칩/카드화 | 🟢 | `ModeBreakdownSection` 리스타일 |
| 10~14 | 게이지·CTA·Delta·쉐브론·타이포 | 🟢 | 전부 UI |
| 15 | 기간필터 네이티브 | 🟡 | Capacitor 네이티브 피커 연동 |
| 16~17 | 정렬 컨트롤·다크모드 색 | 🟡 | UI + 토큰 정리 |

### 데이터가 더 필요한 항목 상세

- **스트릭(3번)**
  - 🟢 *월 단위* "연속 100% 이행 N개월" / "연속 활동 N개월" → `monthlyRates`를 최근달부터 순회. **추가 데이터 0.** → 가성비 최고, v2 채택.
  - 🟡 *일 단위* "N일 연속 적립" → `payment_history` 날짜 정렬로 가능하나, 약속일이 월 특정일이라 의미 약함. **월 단위 권장(일 단위 보류).**
  - 🟡 *뱃지 영속화* → 판정은 위 데이터로 가능. 획득 이력 저장을 원하면 테이블 추가(`DEFAULT` 필수, 비파괴). **MVP는 저장 없이 매번 계산.**
- **누적 곡선(7번)** — payment_history를 월별 누적합으로 접는 `getCumulativeSavings()` 유틸 신규. 쿼리 확장 불필요(데이터는 다 있음).
- **전망 신호등(8번)** — **신규 데이터 0.** `useGoalProgress`가 이미 `projectedProgressPercent`/`dDay` 반환. "예상 진척 ≥100% 초록 / 80~100% 노랑 / 미만 빨강" 임계값→색 매핑 1개만 추가.

---

## 4. v2 목표 구조 (To-Be)

```
[통계]  ← 헤더

┌─ ① 행동: 이행 HERO ───────────────────────┐  ← 정체성을 체현(별도 선언 배너 없음)
│  이번 달 이행률 88%  ▓▓▓▓▓▓▓░░             │
│  🔥 연속 3개월 100% 이행 중                  │  ← consistency 한 줄을 스트릭 표현으로 '교체'
│  ─────────────────────────────            │
│  월별 이행 추세 (목표선 100% + 미달 강조)     │  ← 6번
│   ▁▂▃▅▄█  ← 막대 탭하면 그 달 요약 펼침      │  ← 드릴다운(신규)
└──────────────────────────────────────────┘
   ※ "첫 100% 달성!" 같은 마일스톤은 회전 인사이트 풀에만 합류(상시 노출 X, 특별한 달에만 교대로 뜸)

┌─ ② 결과: 자산 / 목적 진척 / 상태 ──────────┐
│  지금까지 모은 돈 · 목적별 진척 · 모드요약    │
└──────────────────────────────────────────┘
   "토리치는 왜 수익률을 안 보여주나요? →"        ← 2번(A안): 자산 섹션 바로 아래 맥락 배치

┌─ ③ 전망: 목표 신호등 (신규) ───────────────┐  ← 8번 + 1번 IA 완성
│  결혼자금 D-120 · 예상 진척 🟡 92%          │
└──────────────────────────────────────────┘
```

> ⓘ 수익률 링크는 "돈 얼마 모았다"는 자산 정보가 나온 직후에 두어 "근데 수익률은 왜 없지?"라는 의문이 생기는 지점과 붙인다. 최상단 격상은 기각(§2-1 참조).
> ⓘ 성취 영역에 **새 카드/새 줄을 추가하지 않는다.** 보상감은 ① 기존 consistency 줄 → 스트릭 표현 교체, ② 마일스톤 → 회전 인사이트 합류, ③ 차트 막대 드릴다운으로 채운다(§2-2 참조).

**핵심 변경 요약**

| 영역 | As-Is (1차 결과) | To-Be (v2) |
|---|---|---|
| 수익률 링크 | 맨 아래(맥락 없음) 회색 링크 | **자산 섹션 바로 아래** 맥락 배치(A안). 정체성 선언은 Hero가 체현 |
| 보상 장치 | "지난달보다 X원" 한 줄 + consistency 집계 | **consistency → 스트릭 표현 교체** + 마일스톤 회전 합류 (새 줄·카드 X) |
| 과거 달 디테일 | 막대 높이로만 | **막대 탭 → 그 달 요약 드릴다운** |
| 시간축 | 행동→결과 | **행동→결과→전망** (신호등 추가) |

---

## 5. 구현 단계 (Phase) — 확정 순서 2 → 3 → 1(+8)

> 순서 근거: 2번(수익률 선언)이 가장 싸고 독립적이며 **다른 섹션의 톤 기준점**이 된다. 그 아래에서 3번(과거 성취=스트릭)과 8번(미래 전망=신호등)이 수익률의 보상감을 과거·미래 양쪽에서 대체하고, 그 둘을 배치하는 행위가 곧 1번 IA의 '전망' 위계를 완성한다. 세 개가 하나의 서사가 된다.

### Phase A — 수익률 링크 맥락 재배치 (2번, A안 확정) 🟢
**파일:** `app/components/StatsSections/StatsContent.tsx`

- **최상단 격상은 하지 않는다.** 정체성 선언은 Hero가 이미 체현하므로 별도 브랜드 배너를 만들지 않는다.
- 현재 `sections` 배열 **맨 끝**에 붙어 있는 `<Link href="/faq">` 를 **자산 섹션(`asset`) 바로 아래**로 옮긴다.
  - 현 구조: `sections` 렌더 후 `<Link>` 가 전체 맨 끝. → `asset` 직후에 오도록 배치 변경.
  - 단, `asset` 은 `totalPaidPrincipal > 0` 일 때만 렌더되므로, **링크를 `asset` 과 한 묶음으로 묶어** 자산 카드가 숨으면 링크도 함께 자연스러운 폴백 위치(맨 끝)로 가도록 처리하거나, 자산이 없을 때의 노출 위치를 명시한다.
  - 저데이터 분기(`goalProgress → hero → asset → status`)에서도 동일하게 `asset` 직후를 유지.
- 카피·톤은 현행 유지("토리치는 왜 수익률을 안 보여주나요? →"), 탭 시 `/faq` 이동도 그대로.
- **준수:** semantic 토큰만, 150줄 이내.
- **남은 미세 결정:** 자산 카드가 없을 때(=`totalPaidPrincipal === 0`) 링크를 ⓐ 그대로 맨 끝 폴백 vs ⓑ 비노출. → 신규/저데이터엔 군더더기이므로 **ⓑ 비노출** 권장(돈 정보가 있을 때만 "왜 수익률 없냐"가 의미 있음).

### Phase B — 이행 회고 강화: 스트릭 교체 + 마일스톤 + 차트 드릴다운 (3번 + 6번 일부) 🟡(데이터 추가 없음)

> **원칙: 새 카드·새 줄을 추가하지 않는다.** 뱃지 그리드(별도 컴포넌트)는 만들지 않는다. 이미 있는 자리를 더 의미 있게 바꾼다.

**B-1. consistency 한 줄 → 스트릭 표현으로 교체**
- 파일: `app/hooks/chart/useChartData.ts`(또는 신규 `app/hooks/stats/useStreak.ts`) + `app/components/StatsSections/MonthlyTrendSection.tsx`
- 현재 `MonthlyTrendSection`의 꾸준함 한 줄("최근 N개월 중 M개월 100% 이행")을 **연속 표현**으로 교체:
  ```ts
  // monthlyRates[0] = 가장 최근 달. 최근→과거로 순회.
  currentPerfectStreak   // 최근부터 연속 100% 달 수  → "🔥 연속 N개월 100% 이행 중"
  currentActiveStreak    // 최근부터 연속 활동(total>0) 달 수
  longestPerfectStreak   // 역대 최장 100% 연속 (스트릭 0일 때 폴백 문구용)
  ```
  - 스트릭이 0이면(최근 달 미달) "최고 기록 N개월" 같은 폴백으로 자연 강등 — 비판 톤 금지.
  - **자리 1개 유지. 줄/카드 추가 없음.**

**B-2. 마일스톤 문구 → 회전 인사이트 풀에 합류 (상시 노출 X)**
- 파일: `app/hooks/stats/useStatsInsights.tsx`
- 기존 "지난달보다 X원 더" 풀에 마일스톤 문구를 **조건부로 push** (예: 이번 달 첫 100% 달성, 활동 N개월 돌파).
- `RotatingInsights`가 한 번에 하나만 번갈아 노출 → 동시 정보밀도 불변, 특별한 달에만 잠깐 등장.

**B-3. 차트 막대 드릴다운 (과거 달 디테일)**
- 파일: `app/components/StatsSections/MonthlyTrendSection.tsx` (Recharts `BarChart`)
- 막대 탭/클릭 시 그 달 요약 노출: **이행 N/M건 · 이행률 %**(데이터는 `chartData[i].completed/total/rate`에 이미 있음).
- **확정 표현(ⓐ):** Recharts `onClick`으로 선택 인덱스 상태 → **차트 아래 고정 요약 줄** + 선택된 막대를 강조색(`chartEmphasisColor` 로직 확장)으로 하이라이트. 툴팁(ⓑ)은 모바일 손가락 가림·가장자리 잘림·hover 부재로 기각. **모달/새 페이지 금지**(정적 라우팅·캘린더 중복 회피).
- 캘린더 탭(일별 체크)과 구분: 여기서는 **그 달 집계 요약까지만**, 일별 항목 편집은 캘린더 영역으로 둔다.

### Phase C — 전망 신호등 + IA 완성 (8번 + 1번) 🟡(저가)
**파일:**
- 신규 `app/components/StatsSections/GoalOutlookSection.tsx` — 목적별 D-day + 예상 진척 신호등.
- `app/utils/goal-status.ts` (또는 신규) — `projectedProgressPercent` → 신호등 색 임계값 매핑.
- `app/components/StatsSections/StatsContent.tsx` — 섹션 순서를 **행동→결과→전망** 으로 마무리.

**신호등 규칙(초안):** 예상 진척 ≥100% 🟢 / 80~99% 🟡 / <80% 🔴. (D-day 임박 가중은 추후.)
- **준수:** 신호등 색도 semantic 토큰(`--success`/`--warning`/`--destructive` 계열). 하드코딩 hex 금지.

### (후속) 2순위 이후 — 본 v2 범위 밖, 별도 진행
- 4번 놓친 항목→완료 연결 / 5번 주의 목적 우선 / 6번 차트 목표선·미달 강조 / 7번 누적 곡선 / 9번~ UI 다듬기.

---

## 6. 준수 규칙 (CLAUDE.md)
- 컴포넌트 1파일 **150줄 이내**, 데이터/계산은 훅, 컴포넌트는 props 렌더만.
- **색은 semantic 토큰만** (하드코딩 hex 금지). 다크모드 자동 대응 — `getComputedStyle`로 CSS 변수 읽는 기존 패턴 유지.
- 아이콘은 **Phosphor**(`@phosphor-icons/react`).
- shadcn/ui 재사용.
- 커밋: `type(scope): 한글 설명 ~함/~음` (예: `feat(stats): 수익률 철학을 상단 브랜드 배너로 격상함`).

---

## 7. 영향 반경 / 사이드 이펙트
- **운영 앱 호환성**: ✅ 안전 — 순수 프론트 UI + 기존 데이터 파생 계산. 구버전 iOS 앱(구코드+신DB) 영향 없음.
- **Supabase 스키마**: 해당 없음 (뱃지 MVP는 저장 없이 계산). *영속화 선택 시* 새 테이블 1개 `DEFAULT` 필수·비파괴로만.
- **API Route / Edge Function**: 해당 없음.
- **정적 라우팅**: `/stats` 정적 경로 유지, 새 `[param]` 없음. 배너 탭은 기존 `/faq` 정적 경로.
- **DB 타입 재생성**: 불필요(스키마 무변경). 영속화 선택 시에만 `supabase gen types`.

---

## 8. 검증 (구현 후)
**로컬 동작 (`/stats`)**
- golden: 투자 다건 + 활성 목표 → 배너·Hero·스트릭·뱃지·신호등 정상.
- empty: 투자 0건 → 배너 노출, 빈 상태 깨지지 않음.
- 스트릭 경계: 연속 0 / 연속 1 / 중간에 끊긴 케이스 문구 정확.
- 신호등: 예상 진척 100%↑/80~99%/80%↓ 색 분기 + 다크모드 대비.

**빌드**
```bash
npm run build:app
ls out/stats/index.html
```
- 빌드 실패 시 백업 잔재 복구:
  ```bash
  mv server-routes.backup/api app/api && mv server-routes.backup/auth app/auth && rm -rf server-routes.backup
  ```

**머지 전 점검**
- `capacitor.config.ts`: `server.url` 주석 처리 + `loggingBehavior: 'production'`.
- `git status`에 `app/api/*`, `app/auth/*` deleted 없음 / `server-routes.backup/` 잔재 없음.

---

## 9. 착수 전 확정할 결정사항
1. ~~스트릭 단위~~ → **확정: 월 단위** (`monthlyRates` 기반, 추가 데이터 0). 약속일이 월 특정일이라 일 단위는 의미 약함.
2. ~~뱃지 영속화~~ → **확정: 뱃지 그리드 자체를 기각.** 보상감은 스트릭 교체 + 마일스톤 회전 합류 + 차트 드릴다운으로 대체(별도 저장·에셋 0).
3. ~~수익률 배너 형태/노출~~ → **확정: A안 (자산 섹션 아래 맥락 배치, 최상단 격상 기각).** 남은 건 자산 0원일 때 링크 비노출 여부(Phase A 권장: 비노출).
4. ~~구현 순서~~ → **확정: 2 → 3 → 1(+8)** (Phase A → B → C). 근거는 §5 도입부.
5. ~~차트 드릴다운 표현~~ → **확정: ⓐ 차트 아래 요약 줄** + 선택 막대 강조색 하이라이트. 모바일에서 손가락 가림·가장자리 잘림·hover 부재 문제로 툴팁(ⓑ) 기각.

---

## 10. 작업 순서 한눈에
```
Phase A  수익률 링크 → 자산 섹션 아래 맥락 재배치 (2번 A안)
Phase B  consistency→스트릭 교체 + 마일스톤 회전 합류 + 차트 막대 드릴다운 (3번+6번, 데이터 추가 0, 뱃지 그리드 X)
Phase C  전망 신호등 + IA '행동→결과→전망' 완성 (8번 + 1번)
검증     로컬 시나리오 + build:app + out/stats + 머지 전 체크리스트
```
