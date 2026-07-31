# 01 — 디자인 실태 진단 (Audit)

> 자동 진단. 모든 수치는 `rg`(ripgrep)로 `app/`·`components/` 소스를 직접 훑어 집계했다. 추측 없음.
> 집계 기준: `.tsx`/`.ts` 소스. `node_modules`·`.next`·`out` 제외.
> 진단 일자: 2026-08-01 · 브랜치 `design-system-setup` (base `style/104-goal-pace-ui`)

---

## 진단 요약

### AI스러움 점수: **28 / 100** (낮음)

이 저장소는 "시스템이 없는" 전형적인 AI 슬롭이 **아니다.** 오히려 그 반대다. 점수를 두 축으로 쪼개면:

| 축 | 점수 | 근거 |
|---|---|---|
| **아키텍처(토큰 설계)** | 12 / 100 · 매우 우수 | 3-Layer 토큰(Primitives→Semantics→Usage), `globals.css`에 **하드코딩 hex 0개**(전부 `hsl()`), 다크모드 1:1 매핑 표, WCAG AA 주석, 살아있는 스타일 가이드 페이지 존재 |
| **집행(규칙 준수)** | 44 / 100 · 드리프트 있음 | 좋은 시스템을 두고도 손으로 우회한 흔적: raw `<button>` 121개, `<Card>` 컴포넌트 부재, 임의 px 폰트 26개, `bg-white` 직접 사용 |

종합 28점은 **"설계는 사람이 정성껏 했는데, 속도를 내며 집행이 새고 있다"**는 상태를 뜻한다.
AI 슬롭의 특징(무작위 hex 난립, 규칙 부재, 아무 값이나)은 거의 없고, 대신 **린트로 강제되지 않은 규칙이 서서히 마모된** 사람 팀의 부채에 가깝다.

**근거 수치 (핵심만):**
- `globals.css` 하드코딩 hex: **0개** (100% `hsl()` 토큰)
- 소스 하드코딩 hex: 18종 ~30회 — 그중 **6종은 차트 캔버스용 승인된 폴백**, 7종은 Google/토리 브랜드색(정당한 예외)
- 버튼: 공용 `<Button>` 70회 vs raw `<button>` **121회** → 공용 컴포넌트 채택률 **약 37%**
- 카드: `bg-card` 76회 / **56개 파일**이 카드 껍데기를 인라인 복붙 — 그런데 `components/ui/card.tsx`는 **존재하지 않음**
- 폰트 크기: 표준 9단계 + **임의 px 7종(26회)** = 실사용 16종
- 간격: 표준 스텝 17종 + `.5` 하프스텝 **약 125회**(4px 그리드 이탈)

---

## 눈에 띄는 문제 3가지

### 1. 버튼이 두 세계로 갈렸다 — 공용 컴포넌트 63%가 미채택
`components/ui/button.tsx`는 variant 8종(default·destructive·outline·secondary·ghost·**soft**·**tonal**·link)과 size 8종을 갖춘 잘 만든 컴포넌트다. 그런데 소스 전체에서 `<Button>`은 70회, 손으로 만든 raw `<button>`은 **121회**다. raw 버튼은 각자 `rounded-full`·`h-12`·`active:scale-[0.99]` 같은 스타일을 인라인으로 다시 칠하고, 포커스 링·disabled·hover 상태가 컴포넌트와 **미묘하게 다르다.**
→ 대표 위치: [ToryRaisingFullScreen.tsx:403-419](app/components/ToryRaising/ToryRaisingFullScreen.tsx#L403) (동일 스타일 버튼 3개 복붙), [DateSelectSheet.tsx](app/components/Common/DateSelectSheet.tsx) (raw 7개)

### 2. 카드 껍데기가 56개 파일에 복붙됐다 — `<Card>` 컴포넌트 부재
`docs/design-system.md`는 "Use `Card`, `CardHeader`, `CardContent` structure"를 명령하지만, `components/ui/`에 **`card.tsx`가 없다.** 실제로는 `<div className="rounded-2xl bg-card ...">` 형태의 카드 껍데기가 **56개 파일**에 각자 다른 radius(`rounded-xl`/`2xl`/`3xl`)·padding·shadow 조합으로 반복된다. 문서와 코드가 어긋난 대표 사례다.
→ 근거: `bg-card` 76회 / 56파일, `rounded-2xl bg-card` 6회 + `rounded-3xl bg-card` 4회 (나머지는 조합이 제각각)

### 3. 타입 스케일이 샌다 + 문서와 실제가 반대
`docs/design-system.md`는 "본문은 `text-base`(16px)가 기본, `text-sm` 쓰지 말 것"이라 못박지만, 실제 코드는 `text-sm` **223회** + `text-xs` **118회** = 341회로 작은 글씨가 지배한다(`text-base`는 79회). 게다가 스케일을 벗어난 임의 px가 **26회**: `text-[11px]`(17), `text-[10px]`(3), `text-[15px]`(2), `text-[0.8rem]`(2), `text-[17px]`·`text-[34px]`·`text-[2rem]` 각 1. 통계 앱이라 조밀함이 필요한 건 이해되지만, **"공식 스케일"이라 부를 단계가 정의된 적이 없어** px가 새는 걸 막을 근거가 없다.

---

## 항목별 상세

### 색 (Color)

**총평:** 토큰 레이어(`globals.css`)는 하드코딩 hex가 **0개**로 모범적이다. 문제는 소스 파일의 잔여 하드코딩과, 그 대부분이 한곳(차트 훅)에 몰려 있다는 점.

- **`globals.css` hex:** 0개. 전부 `hsl()` primitive. ✅
- **소스 하드코딩 hex:** 18종 · 약 30회. 성격별로:
  - **차트 캔버스 폴백 (정당하나 중복):** [useChartColors.ts:17-32](app/hooks/chart/useChartColors.ts#L17), [useChartData.ts:117-131](app/hooks/chart/useChartData.ts#L117). `getPropertyValue('--chart-profit') || '#22C55E'` 패턴 — CSS 변수를 먼저 읽고 실패 시 hex 폴백. `design-system.md`가 허용하는 방식이라 **틀린 건 아니지만**, 같은 초록/회색을 3~4회 다른 케이싱으로 되풀이한다.
  - **브랜드 예외 (정당):** Google 로그인색 `#4285F4 #EA4335 #FBBC05 #34A853`, 토리 브라운 `#CDA067 #744F2F #5C3E24`.
  - **진짜 하드코딩:** [ConcernSection.tsx:17,77](app/components/LandingPageSections/ConcernSection.tsx#L17) `#292A2E` 패널/그라디언트, [ToryRaisingFullScreen.tsx:233](app/components/ToryRaising/ToryRaisingFullScreen.tsx#L233) `bg-[#ece4f7]`.
- **거의 같은데 미묘하게 다른 색 쌍:**
  - `#16a34a` vs `#16A34A` — **동일 색, 케이싱만 다름** (둘 다 useChartData/useChartColors)
  - `#9c9ea6` vs `#9C9EA6` — **동일 색, 케이싱만 다름**
  - `#22C55E`(차트 profit 폴백) vs `--palette-brand-500`(`hsl(140,98%,39%)`≈`#02c463`) — 같은 역할, 다른 출처
- **그라디언트:** 소스 3곳뿐 — [Dashboard.tsx:76](app/components/Dashboard.tsx#L76)·[HeroSection.tsx:132](app/components/LandingPageSections/HeroSection.tsx#L132)(둘 다 페이드 마스크), [ConcernSection.tsx:77](app/components/LandingPageSections/ConcernSection.tsx#L77). 그 외 브랜드 그린 패널 `--goal-well`은 `globals.css`에 토큰화됨. **장식용 그라디언트 남용 없음.** ✅
- **`bg-white`/`text-white`/`bg-black` 직접 사용:** raw 집계 `bg-white` 42 · `text-white` 28 · `bg-black` 15. **단, 맥락 분해가 중요:**
  - 약 30회는 `app/components/design-system/*`(스타일 가이드 데모의 색 견본) 또는 `bg-white/10`·`/15`·`/70`(유색 면 위 반투명 오버레이) → 정당.
  - **진짜 위반은 소수:** [ToryRaisingFullScreen.tsx:284,333,403-419](app/components/ToryRaising/ToryRaisingFullScreen.tsx#L284)의 불투명 `bg-white` 카드/버튼 — `bg-card`여야 다크모드에서 깨지지 않는다.

### 타이포그래피 (Typography)

- **font-size 실사용 (표준 9종):** `text-sm` 223 · `text-xs` 118 · `text-base` 79 · `text-3xl` 26 · `text-lg` 25 · `text-xl` 19 · `text-2xl` 17 · `text-5xl` 3 · `text-4xl` 3.
- **임의 px (7종·26회):** `text-[11px]` 17 · `text-[10px]` 3 · `text-[15px]` 2 · `text-[0.8rem]` 2 · `text-[17px]` 1 · `text-[34px]` 1 · `text-[2rem]` 1.
- **규칙성:** 표준 스텝 자체는 Tailwind 기본이라 배수 관계가 있지만, **역할(display/title/body/caption)에 이름을 붙인 스케일이 정의된 적이 없다.** 그래서 `text-3xl`(26회)과 `text-2xl`(17회)이 언제 무엇에 쓰이는지 규칙이 없고, 11px/10px/15px/17px가 틈으로 샌다.
- **font-weight (5종):** `font-semibold` 167 · `font-medium` 144 · `font-bold` 50 · `font-normal` 9 · `font-extrabold` 3. 핵심 3종(medium/semibold/bold)이 지배적, `extrabold`(3)·`normal`(9)이 잔여 이탈.
- **자간/행간:** `tracking-tight` 72회로 헤딩 규칙("항상 tracking-tight")은 잘 지켜짐 ✅. `leading-*`은 7종 산발.

### 간격 (Spacing)

- **표준 스텝 (magnitude 17종):** 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16, 40, 52.
- **최다 사용:** `gap-3`(83) · `gap-2`(75) · `px-4`(69) · `py-3`(55) · `space-y-2`(43) · `px-3`(43) · `px-6`(38) · `p-6`(33) · `p-4`(31).
- **4px 그리드 이탈(`.5` 하프스텝):** `gap-1.5`(18)·`py-1.5`(16)·`py-2.5`(14)·`px-2.5`(12)·`py-3.5`(10)·`py-0.5`(9)·`mt-0.5`(9)… 합계 **약 125회**. Tailwind에선 정식 값(2px 단위)이지만, 과제 기준("4의 배수 이탈")으로는 정리 대상.
- **임의 px 브래킷:** `min-h-[48px]`·`max-h-[48px]`(각 6, 배수 OK), 그러나 `h-[3px]`·`h-[2px]`·`w-[5px]`·`text-[0.8rem]` 성격의 미세 이탈과 `h-[812px]`·`w-[375px]`(iPhone 목업 하드코딩), `mb-[6%]`·`bottom-[34%]`(퍼센트) 등 산발.

### 컴포넌트 (Component)

- **버튼 구현 방식:** 최소 2가지 — 공용 `<Button>`(70회, variant/size 완비) vs raw `<button>`(**121회**, 각자 인라인 스타일). 채택률 37%.
- **같은 역할·다른 스타일:** [ToryRaisingFullScreen.tsx:403,411,419](app/components/ToryRaising/ToryRaisingFullScreen.tsx#L403) 3개 버튼이 `h-12 rounded-full bg-white border ... text-sm font-semibold`를 각각 복붙 — 하나의 `<Button variant size>`로 대체 가능.
- **shadcn 프리미티브:** `components/ui/`에 18종(alert·button·calendar·checkbox·input·label·popover·switch·table·textarea·time-picker 등). 단 **`card.tsx` 없음.**
- **화면 파일 내 직접 스타일링:** 카드 껍데기 56파일 인라인, raw 버튼 40여 파일 인라인 — 공용 컴포넌트로 승격되지 않은 반복이 구조 전반에 퍼져 있음.

### 구조 (Structure)

- **라우트(화면) 수:** `page.tsx` 19개 (`app/page`·`stats`·`goal/detail`·`calendar`·`investment`·`settings/*`·`tory`·`add`·`faq`·`login`·`notifications`·`design-system` 등).
- **반복 카드 레이아웃:** `bg-card` 껍데기가 **56파일**에 걸쳐 사용 — 사실상 모든 정보 화면의 기본 단위. 그런데 공용 `<Card>`가 없어 radius/padding/shadow가 파일마다 미세하게 다름.
- **시각 위계:** 헤딩 규칙(`tracking-tight`, H1~H3 스케일)은 `design-system.md`에 정의돼 있고 72회 `tracking-tight`로 준수. 다만 본문 크기(sm/xs 341회)가 문서의 "base 우선"과 반대라 **위계의 바닥이 문서보다 한 단계 작다.**
- **다크모드 대비 깨짐:** 최근 수정 이력이 이 위험을 증명 — 진행바 트랙 `bg-surface-hover`가 다크에서 `bg-card`(둘 다 coolgray-900)와 겹쳐 사라졌고, `--progress-track` 토큰 신설로 해결(`globals.css:198`, 커밋 `1174dcb`). **아직 남은 곳:** [ToryRaisingGrowthSection.tsx:67](app/components/ToryRaising/ToryRaisingGrowthSection.tsx#L67)의 `bg-surface-hover` 트랙(보더가 있어 윤곽은 보이나 동일 리스크).

---

## 개선 우선순위 1~5

| # | 무엇을 | 왜 | 예상 작업량 |
|---|---|---|---|
| **1** | **공식 타입 스케일 토큰 정의**(display/title/heading/body/label/caption)를 `globals.css`·Tailwind에 추가하고, 임의 px 26회를 최근접 스케일로 치환 | "스케일"이 이름으로 존재하지 않아 px가 계속 샌다. 정의가 있어야 린트·리뷰로 막을 근거가 생김 | S (토큰 정의 1h) + M (치환 2~3h) |
| **2** | **`<Card>` 공용 컴포넌트 신설** 후 대표 화면부터 인라인 껍데기 마이그레이션 | 문서가 명령하는 `Card`가 실재하지 않고 56파일이 복붙 중. 카드 하나로 radius/padding/shadow가 통일됨 | S (컴포넌트) + L (56파일 점진 이관) |
| **3** | **raw `<button>` → 공용 `<Button>` 통합** (soft/tonal/ghost variant 활용) | 121개 raw 버튼의 포커스·disabled·hover가 제각각 → 접근성/일관성 손해. 컴포넌트는 이미 충분히 강력함 | L (40여 파일, 로직 불변·className만) |
| **4** | **차트 색 폴백 단일화** — `useChartColors`/`useChartData`의 중복 hex(케이싱 불일치 포함)를 하나의 상수/토큰 매핑으로 | 같은 초록/회색이 3~4곳에 다른 케이싱으로 존재 → 색 바꾸면 누락 발생 | S (1~2h, 값 불변 리팩터) |
| **5** | **간격 하프스텝(`.5`) 정리 + `--progress-track` 잔여 트랙 통일** | 4px 그리드 일관성 + 다크모드 대비 잔여 리스크(ToryRaisingGrowthSection) 제거 | M (기계적 치환, 시각 확인 필요) |

> **주의:** 1·4·5는 저위험(값 불변/추가). 2·3은 파일 수가 많아 점진적·검증 동반 필요. 기능 로직은 어느 항목도 건드리지 않는다(className·구조만).
