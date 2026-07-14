# 목적·적립 상세 페이지 UX & 심미성 진단

> 작성일 2026-06-28 · 대상: `목적 상세`(`/goal/detail`), `적립 상세`(`/investment`)
> 관점: **읽기/조회 경험의 시각 위계와 심미성**. 폼(추가/수정)의 동작 일관성은 [ux-consistency-audit.md](ux-consistency-audit.md)에서 다루므로, 이 문서는 "상세를 펼쳤을 때 눈에 보이는 화면" 자체를 본다.
> 방법: 두 라우트의 전체 컴포넌트 트리를 코드로 정독하고 디자인 토큰(`globals.css`)의 실제 HSL 값으로 WCAG 대비를 계산함. (라이브 렌더 캡처는 시도했으나 devtools 브라우저가 미인증 세션이라 상세가 온보딩으로 리다이렉트되어 화면 캡처는 불발 — 분석은 100% 코드/토큰 근거.)

---

## 0. 한 줄 결론

구조와 로직은 잘 정돈돼 있으나, **"이 화면에서 가장 중요한 숫자"를 시각적으로 띄워주지 못한다.** 모든 정보가 같은 무게의 `라벨 : 값` 행으로 평평하게 깔려 있고, 강조에 쓰는 브랜드 그린·보조 회색이 **흰 배경에서 WCAG 대비 미달**이라 "옅고 밋밋한" 인상을 준다. 심미성 개선의 80%는 (1) 히어로 숫자 1개 세우기, (2) 텍스트용 그린/회색 톤 교정, (3) 같은 개념(진행률·탭·여백)을 세 화면에서 한 규격으로 통일 — 이 세 가지에서 나온다.

| 영역 | 점수 | 메모 |
|---|---|---|
| 정보 정확성·로직 | 양호 | 분기·계산 훅 분리 깔끔 |
| 시각 위계(Hierarchy) | **취약** | 히어로 부재, 전부 동일 무게 |
| 색·대비(Aesthetics/A11y) | **취약** | 그린 텍스트 2.85:1, 보조회색 3.62:1 |
| 일관성(3화면) | 보통 | 진행률·탭·패딩 규격 제각각 |
| 여백·리듬 | 양호 | `py-6`/`py-8` 후함, 일부 불일치 |
| 인터랙션 어포던스 | 보통 | 작은 터치 타깃, 탭/행 어포던스 약함 |

---

## 1. 화면 구조 맵 (지금 상태)

같은 "상세"인데 **세 가지 다른 골격**이 공존한다. 이게 일관성 문제의 뿌리다.

| | 목적 상세 | 적립 상세 — 주식 | 적립 상세 — 예적금/현금 |
|---|---|---|---|
| 진입 | `/goal/detail` | `/investment` (`getRecordType==='investment'`) | `/investment` (그 외) |
| 골격 | `SubPageScaffold` | **자체 fixed 헤더+스크롤** (Scaffold 미사용) | `SubPageScaffold` |
| 헤더 | 뒤로 + ⋮ | 뒤로 + 스티키 제목 + 🔔 + ⋮ | 뒤로 + 🔔 + ⋮ |
| 본문 패딩 | `px-6` | `px-6` | `px-4`(Scaffold) |
| 상단 블록 | 제목(텍스트) | 아바타+제목+서브 | 아바타+제목+서브 |
| 탭바 | 없음 | 개요/투자정보/납입기록 **항상 노출** | 개요/적립정보/납입기록 **기록 있을 때만** |
| 진행률 | `GoalProgressSection` (`py-6`, `text-base`) | `ProgressSection` (`py-8`, `text-lg`) | `ProgressSection` |
| 강조 카드 | 마감일 Alert | — | 만기 예상 수령액 카드 |

- 목적 상세: [GoalDetailClient.tsx](app/goal/detail/GoalDetailClient.tsx)
- 주식 상세: [InvestmentDetailView.tsx](app/components/InvestmentDetailView.tsx) — `SubPageScaffold`를 쓰지 않고 [InvestmentDetailView.tsx:136-179](app/components/InvestmentDetailView.tsx#L136-L179)에서 fixed 헤더/스크롤을 직접 구현
- 예적금/현금 상세: [SavingsCashDetailView.tsx](app/components/SavingsCashDetailView.tsx)

> **핵심 관찰**: 주식 상세만 공용 `SubPageScaffold`를 우회한다. 헤더 z-index(`z-50` vs Scaffold의 `z-30`), 패딩 계산, safe-area 처리가 한 곳에 중복 정의돼 있어 향후 헤더 규격을 바꾸면 한 화면만 어긋날 위험이 크다.

---

## 2. 심미성(Aesthetics) 진단

### 2-1. 🔴 "히어로 숫자"가 없다 — 가장 큰 심미성 손실

상세 페이지의 첫 화면은 **"내가 지금 얼마나 모았나"**라는 한 가지 질문에 답해야 한다. 그런데 지금은:

- **목적 상세**: 제목 아래 바로 진행률 바 → "목적 정보" 섹션에서 `목표 금액 / 이미 모은 돈 / 현재 모은 금액 / 마감일 예상 / 남은 금액`이 **전부 동일한 `text-base font-semibold` 행**으로 나열된다. [GoalInfoSection.tsx:21-58](app/components/GoalDetailSections/GoalInfoSection.tsx#L21-L58). 정작 주인공이어야 할 **"현재 모은 금액"**이 5개 행 중 하나로 묻힌다.
- **주식 상세 개요 탭**: "개요"를 눌러도 보이는 건 아바타+제목+서브 한 줄뿐이다([InvestmentDetailOverview.tsx](app/components/InvestmentDetailSections/InvestmentDetailOverview.tsx)). 차트도, 큰 평가금액도 없어 탭 이름값을 못 한다.

반례로 **예적금/현금**의 "만기 예상 수령액" 카드만 유일하게 위계를 갖췄다 — `text-2xl font-bold tabular-nums` 한 숫자가 카드 안에서 빛난다([SavingsCashInfoSection.tsx:92-112](app/components/SavingsCashDetailSections/SavingsCashInfoSection.tsx#L92-L112)). **이 패턴을 세 화면 상단의 표준 히어로로 끌어올려야 한다.**

> 이는 이미 팀이 정의한 원칙이다 — [goal-form-ux.md](goal-form-ux.md)의 "원칙 3. 입력값 히어로". 폼에는 적용됐지만 **상세(조회) 화면에는 적용되지 않았다.**

**처방**: 각 상세 최상단에 단일 히어로 블록.
- 목적: `현재 모은 금액`을 `text-3xl/4xl font-bold tabular-nums` + 그 아래 `목표까지 N원` 보조줄, 진행률 바를 히어로 바로 밑에.
- 주식/적립: `총 납입액`(또는 평가금액)을 동일 규격으로.

### 2-2. 🔴 색·대비 — 강조색이 흰 배경에서 너무 옅다 (WCAG 미달)

`globals.css`의 실제 토큰 값으로 흰 배경(`#fff`) 대비를 계산했다.

| 토큰 | 용도 | 대비 | AA 본문(4.5) | AA 큰글씨(3.0) |
|---|---|---|---|---|
| `text-primary` = brand-600 `hsl(140,98%,35%)` | D-day, "목표 달성 🎉", 그린 강조 | **2.85:1** | ❌ | ❌ |
| `bg-brand-500` `hsl(140,98%,39%)` | 진행률 바 채움 | **2.32:1** | — | ❌(UI 3.0) |
| `text-foreground-subtle` = coolgray-400 | 힌트·캡션 다수 | **3.62:1** | ❌ | ✅ |
| `text-green-600` (raw) | "✓ 완료됨" 상태 | **3.30:1** | ❌ | — |
| `text-red-500` (raw) | "✗ 미완료" 상태 | **3.76:1** | ❌ | — |
| `text-muted-foreground` = coolgray-500 | 행 라벨 | 4.81:1 | ✅ | ✅ |
| `text-foreground-muted` = coolgray-600 | 표 헤더 등 | 5.81:1 | ✅ | ✅ |

문제 지점:
1. **브랜드 그린을 텍스트로 쓰는 모든 곳이 미달.** D-day 값 `text-base font-semibold text-primary`([GoalDetailClient.tsx:183-186](app/goal/detail/GoalDetailClient.tsx#L183-L186)), "목표 달성! 🎉" `text-primary`([GoalDetailClient.tsx:165-167](app/goal/detail/GoalDetailClient.tsx#L165-L167), [InvestmentDetailOverview.tsx:63-65](app/components/InvestmentDetailSections/InvestmentDetailOverview.tsx#L63-L65)). 이 그린은 채도가 높아 화면에선 "선명"해 보이지만 명도가 중간이라 흰 배경에서 글자로는 안 읽힌다. → **텍스트용 진한 그린 토큰**(예: brand-700/800, 대비 ≥4.5)을 따로 만들어 분리하거나, 그린은 배경(`bg-primary/10`)에만 두고 글자는 `text-foreground`로.
2. **힌트/캡션이 거의 다 `foreground-subtle`(3.62:1) + `text-xs`.** 묶기 안내, 소급 안내, 만기 추정 단서 등([UnlinkedRecordsSection.tsx:31-33](app/components/GoalDetailSections/UnlinkedRecordsSection.tsx#L31-L33), [SavingsCashInfoSection.tsx:108-110](app/components/SavingsCashDetailSections/SavingsCashInfoSection.tsx#L108-L110)). 작은 글씨 + 저대비 조합이 "옅고 흐릿한" 인상의 주범. → 캡션 기본을 `foreground-muted`(coolgray-600, 5.81:1)로 한 단계 올리기.
3. **납입 상태색이 raw Tailwind**(`text-green-600`/`text-red-500`)라 [design-system.md](design-system.md) Layer-3 규칙 위반 + 다크모드 미대응 + 대비 미달. → `text-success`/`text-destructive` 시맨틱 토큰화([PaymentHistoryTable.tsx:139-147](app/components/InvestmentDetailSections/PaymentHistoryTable.tsx#L139-L147)).

> 디자인 시스템 문서가 "정보 UI는 coolgray로, 그린은 1~2곳만"이라고 못박았는데([design-system.md](design-system.md) Stats 섹션), 정작 그린이 **텍스트 강조**로 새어 들어가 있다. 규칙과 구현의 어긋남.

### 2-3. 🟠 타이포그래피 위계가 화면마다 다르다

같은 "진행률"인데:
- 목적: `text-base text-muted-foreground` 라벨 + `font-bold text-foreground` 값([GoalProgressSection.tsx:37-42](app/components/GoalDetailSections/GoalProgressSection.tsx#L37-L42))
- 주식/적립: `text-lg font-semibold text-foreground` 라벨·값 동일([ProgressSection.tsx:68-72](app/components/InvestmentDetailSections/ProgressSection.tsx#L68-L72))

섹션 제목도 `text-lg`(상세) vs `text-2xl`(디자인 시스템 H3 규격)로 제각각이고, 페이지 제목은 목적 `text-2xl`([GoalDetailClient.tsx:161](app/goal/detail/GoalDetailClient.tsx#L161)) vs 적립 `text-xl`([InvestmentDetailOverview.tsx:49](app/components/InvestmentDetailSections/InvestmentDetailOverview.tsx#L49)). → **상세 화면 전용 타이포 스케일**(페이지 제목 / 섹션 제목 / 행 라벨 / 히어로 숫자) 4단을 토큰처럼 고정.

### 2-4. 🟡 여백 리듬 미세 불일치

섹션 간 수직 패딩이 `py-6`(목적)과 `py-8`(적립)으로 섞여 있고, 가로 패딩이 `px-6`(목적/주식) vs `px-4`(예적금/현금, Scaffold 기본)로 갈린다. 같은 앱 안에서 두 상세를 오가면 본문 폭이 미묘하게 점프한다. → 상세 본문 가로 패딩 한 값으로 통일.

---

## 3. UX 진단

### 3-1. 🟠 터치 타깃이 모바일 기준 미달
- 묶기/풀기 버튼 `size="xs" h-auto py-1`([LinkedRecordsSection.tsx:47-54](app/components/GoalDetailSections/LinkedRecordsSection.tsx#L47-L54), [UnlinkedRecordsSection.tsx:49-57](app/components/GoalDetailSections/UnlinkedRecordsSection.tsx#L49-L57)) → 높이 약 24~28px로 44px 권장치 미달.
- 알림/메뉴 아이콘 버튼은 `h-9 w-9`(36px)로 그나마 낫지만 여전히 44px 미만.

### 3-2. 🟠 행(row) 어포던스의 비일관
- 예적금/현금 정보 행은 탭하면 편집 진입(`TappableField`, hover 배경)으로 **탭 가능함을 암시**([SavingsCashInfoSection.tsx:28-40](app/components/SavingsCashDetailSections/SavingsCashInfoSection.tsx#L28-L40)).
- 반면 주식 정보 행(`InvestmentField`)·목적 정보 행은 정적이고, 묶인/묶을 투자 행도 **행 자체는 비활성**이고 우측 작은 버튼만 동작한다. 사용자는 "어디는 눌리고 어디는 안 눌리는지" 학습이 안 된다. → 탭 가능 행에 일관된 시각 신호(쉐브론 `>` 또는 hover/press 상태) 규약화.

### 3-3. 🟡 "개요" 탭이 빈약 / 탭 노출 규칙 불일치
- 주식 상세의 개요 탭은 제목 블록만 보여줘 탭으로서 의미가 약하다([InvestmentDetailContent.tsx:44-90](app/components/InvestmentDetailSections/InvestmentDetailContent.tsx#L44-L90)). 히어로(2-1)를 넣으면 자연히 해결된다.
- 탭바가 주식은 **항상** 3개, 예적금/현금은 **기록 있을 때만** 노출. 데이터가 없는 신규 항목에서 두 타입의 화면 구조가 달라 보인다.

### 3-4. 🟡 빈/완료 상태는 양호, 단 강조 과함 점검
- "묶인 투자 없음" 안내([LinkedRecordsSection.tsx:28-31](app/components/GoalDetailSections/LinkedRecordsSection.tsx#L28-L31)), 마감 지남 카드([GoalLifecycleSection.tsx:34-43](app/components/GoalDetailSections/GoalLifecycleSection.tsx#L34-L43))는 카피·톤 모두 좋다.
- 다만 목적 달성 시 **상단 "목표 달성! 🎉"**(제목 밑)와 **하단 달성 카드**(`GoalLifecycleSection`)가 **중복 축하**다. 한 화면에 같은 메시지가 둘. → 상단은 배지/체크로 가볍게, 축하 카드는 하단 한 곳으로.

### 3-5. 🟠 접근성(스크린리더/시맨틱)
- 진행률 바에 `role="progressbar"`·`aria-valuenow/min/max` 부재([GoalProgressSection.tsx:43-50](app/components/GoalDetailSections/GoalProgressSection.tsx#L43-L50), [ProgressSection.tsx:73-79](app/components/InvestmentDetailSections/ProgressSection.tsx#L73-L79)) → 보조기기는 진행률을 못 읽음.
- 탭바가 일반 `<button>` 묶음이라 `role="tab"`/`role="tablist"`/`aria-selected` 없음([InvestmentDetailContent.tsx:58-89](app/components/InvestmentDetailSections/InvestmentDetailContent.tsx#L58-L89)).
- 납입 상태를 색+기호(✓/✗)에 의존 — 색맹 대비 텍스트("완료됨/미완료")가 함께 있어 다행이나, 색은 2-2대로 교정 필요.
- 아이콘 전용 버튼들은 `aria-label`이 잘 붙어 있음(양호).

---

## 4. 우선순위 개선 로드맵

체감 효과 ÷ 비용 순.

### 🔴 P0 — 심미성 임팩트 최대
1. **상세 상단 히어로 블록 공용화**(2-1). 세 화면 공통 `<DetailHero amount label sub />` 도입, 진행률 바를 히어로 직속으로. — *난이도 中*
2. **텍스트용 그린/캡션 회색 대비 교정**(2-2). brand-700+ 텍스트 토큰 신설 또는 그린 글자→`text-foreground` 전환, 캡션 기본 `foreground-muted`로. — *난이도 下* (토큰·클래스 치환)

### 🟠 P1 — 일관성/접근성
3. **진행률·탭·섹션 제목 규격 통일**(2-3, 3-3) + 납입 상태 시맨틱 토큰화(2-2-3). — *난이도 下~中*
4. **주식 상세를 `SubPageScaffold`로 흡수**(1) — 헤더/패딩 중복 제거. — *난이도 中* (※ [CLAUDE.md](../CLAUDE.md) 라우팅/운영 규칙상 헤더 변경은 회귀 점검 필수)
5. **진행률 바 a11y 속성 + 탭 role**(3-5). — *난이도 下*

### 🟡 P2 — 디테일
6. 터치 타깃 44px 확보(3-1) / 탭 가능 행 시각 신호 통일(3-2) / 여백·가로패딩 통일(2-4) / 달성 축하 중복 제거(3-4).

> **운영 안전 메모**: 본 변경은 대부분 클래스·토큰·컴포넌트 추출로 DB/API 스키마 무관(Breaking 아님). 단 4번 헤더 통합은 `output: 'export'` 정적 라우팅과 safe-area 헤더 규격에 닿으므로 [CLAUDE.md](../CLAUDE.md)의 "구버전 앱 + 신버전" 원칙과 머지 전 라우팅 체크리스트를 따른다.

---

## 5. 부록 — 근거

- 대비 수치는 `globals.css`의 실제 HSL 토큰을 sRGB로 변환해 WCAG 2.1 상대휘도 공식으로 계산함(흰 배경 기준, 라이트 모드).
  - `--palette-brand-600: hsl(140,98%,35%)`, `--palette-brand-500: hsl(140,98%,39%)`
  - `--palette-coolgray-400/500/600: hsl(228,5%,54%/46%/41%)`
- 정독한 컴포넌트: 목적 상세 5개 섹션, 적립 상세(주식) 6개 섹션, 예적금/현금 상세, 공용 `SubPageScaffold`/`InvestmentField`/`PaymentHistoryTable`, 포맷 유틸.
- 연계 문서: [ux-consistency-audit.md](ux-consistency-audit.md)(폼 동작 일관성), [goal-form-ux.md](goal-form-ux.md)(입력값 히어로 원칙), [design-system.md](design-system.md)(색 3-Layer·coolgray 우선 규칙), [features/investment-detail.md](features/investment-detail.md).
