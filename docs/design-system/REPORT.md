# 토리치(torich) 디자인 시스템 진단·구축 리포트 (단일 파일 버전)

> 이 문서 한 장에 **작업 방식 + 진단 결과 + 설계한 토큰 + 규칙 + 비포/애프터 + 산출물**을 전부 담았다.
> 레포 밖(노트·다른 저장소·포트폴리오)에 그대로 붙여넣어도 읽히도록 코드/숫자를 인라인했다.
> 대상: Next.js(App Router) + Tailwind v4 + shadcn/ui + Capacitor(iOS) 앱 · 세션 일자 2026-08-01
> 브랜치 `design-system-setup`, 커밋 9개 (push 안 함 · 탐색용)

---

## 0. 한 줄 결론

토리치는 흔한 "AI 슬롭"이 **아니었다.** 이미 3-Layer 토큰(Primitives→Semantics→Usage)·다크모드 1:1 매핑·WCAG 주석을 갖춘, 사람이 정성껏 설계한 시스템이었다. 문제는 **그 규칙을 린트로 강제하지 않아 집행이 서서히 새고 있던 것**이다 — **AI스러움 28/100**. 그래서 이번 작업은 "청소"가 아니라 **① 빠진 것을 채우고(타입 스케일·공용 Card) ② 규칙을 문서·AI룰파일로 못박고 ③ 저위험 드리프트를 실제로 정리**하는 것이었다.

---

## 1. 작업 방식 — 어떻게 했나 (7단계)

이 방법론이 핵심이다. **추측 없이 코드 실측 → 설계 → 규칙화 → 시각 증거 → 안전 적용** 순으로 갔고, 각 단계를 git 커밋으로 분리했다.

| STEP | 무엇을 | 어떻게 (도구·원칙) |
|---|---|---|
| **1. 진단** | 실제 쓰인 값 전수 집계 | `ripgrep`으로 색/폰트/간격/버튼/카드 사용을 **횟수·파일경로까지** 집계. "느낌" 금지, 숫자만 |
| **2. 토큰 설계** | 수집값을 역할 기반으로 압축 | 빈도순 정렬 → 비슷한 값 묶기 → 역할 이름 부여(caption/body/display …) → "N종 → M토큰" 수치화 |
| **3. 규칙화** | AI가 지킬 규칙을 단정형으로 | `docs/…/03-RULES.md` + `.cursorrules` + `CLAUDE.md`에 **append**(기존 보존). "권장" 금지, "~한다/~하지 않는다" |
| **4. 비포 캡처** | 손대기 전 상태 박제 | Playwright로 desktop 1440 · mobile 390 × light/dark full-page. **적용보다 먼저** |
| **5. 적용** | 토큰을 코드에 반영 | **새 브랜치, 단계별 커밋, 로직 불변.** 저위험(추가·값불변·다크안전)만, 각 커밋 후 `tsc`/`eslint` 통과 확인 |
| **6. 애프터 캡처 + 비교** | 변화를 시각 증거로 | 같은 스크립트를 `after`로 재실행 → 외부 의존성 0인 `compare.html`(좌우·테마 탭) |
| **7. 요약** | 돌아와서 이것만 읽게 | 결론·수치·산출물·보류항목·판단근거·후속 |

**관통 원칙**
- **증거 기반**: 모든 수치는 `rg` 집계값. 진단에 추측을 쓰지 않는다.
- **안전 우선**: 눈으로 검증 못 하는(인증 게이트) 화면의 대량 치환은 **일부러 보류**하고 이관 지시로 남긴다. 회귀를 못 보면 바꾸지 않는다.
- **재발 방지**: 일회성 정리보다 규칙+AI룰파일+(제안한)ESLint 가드레일이 본질. 강제가 없으면 다시 샌다.

---

## 2. 진단 결과 (숫자)

### AI스러움 점수: **28 / 100** (낮음) — 두 축으로 분해

| 축 | 점수 | 근거 |
|---|---|---|
| 아키텍처(토큰 설계) | 12 · 매우 우수 | `globals.css` 하드코딩 hex **0개**(전부 hsl), 3-Layer, 다크 1:1, WCAG 주석, 살아있는 스타일 가이드 페이지 존재 |
| 집행(규칙 준수) | 44 · 드리프트 | 좋은 시스템 두고 손으로 우회: raw `<button>` 121, `<Card>` 부재, 임의 폰트 px 26, `bg-white` 직접 사용 |

### 핵심 실측치

| 항목 | 값 |
|---|---|
| `globals.css` 하드코딩 hex | **0** (100% hsl 토큰) |
| 소스 하드코딩 hex | 18종 ~30회 (그중 6종은 차트 캔버스 승인 폴백, 7종은 Google/토리 브랜드색) |
| 버튼 | 공용 `<Button>` 70회 vs raw `<button>` **121회** → 채택률 ~37% |
| 카드 | `bg-card` 76회 / **56파일**이 껍데기 복붙 — 그런데 `Card` 컴포넌트 **없음** |
| 폰트 크기 | 표준 9단 + **임의 px 7종 26회** = 실사용 16종, 역할 스케일은 0 |
| font-weight | 5종 (semibold 167·medium 144·bold 50·normal 9·extrabold 3) |
| 간격 | 표준 magnitude 17종 + `.5` 하프스텝 **~125회**(4px 그리드 이탈) |

### 눈에 띈 문제 3가지
1. **버튼이 두 세계** — 잘 만든 공용 Button(variant 8·size 8)을 두고 63%가 raw `<button>` 인라인. 포커스·disabled·hover가 제각각.
2. **카드 껍데기 56파일 복붙** — 문서는 `Card` 사용을 명령하는데 컴포넌트가 없어 radius/padding/shadow가 파일마다 다름.
3. **타입 스케일이 샌다 + 문서와 반대** — 문서는 "본문 16px 기본"인데 코드는 `text-sm`(223)+`text-xs`(118)가 지배. 게다가 `text-[11px]` 등 임의 px 26회.

---

## 3. 설계한 디자인 토큰 (그대로 재사용 가능)

### 3-1. 타입 스케일 (신규) — Tailwind v4 `@theme`
```css
/* globals.css @theme inline 블록. text-caption … text-display 유틸리티가 생성됨 */
--text-caption: 0.75rem;    --text-caption--line-height: 1rem;    /* 12 · 캡션·메타·배지 */
--text-label: 0.875rem;     --text-label--line-height: 1.25rem;   /* 14 · 조밀 데이터·보조 라벨 */
--text-body: 1rem;          --text-body--line-height: 1.5rem;     /* 16 · 본문 기본 */
--text-heading: 1.25rem;    --text-heading--line-height: 1.75rem; /* 20 · 카드 제목 */
--text-title: 1.5rem;       --text-title--line-height: 2rem;      /* 24 · 섹션 제목 */
--text-display: 1.875rem;   --text-display--line-height: 2.25rem; /* 30 · 히어로 숫자·대형 KPI */
--text-display-lg: 2.25rem; --text-display-lg--line-height: 2.5rem;/* 36+ · 랜딩 히어로 전용 */
```
> 폰트 굵기는 `font-medium`·`font-semibold`·`font-bold` **3종만 명시**(본문은 미지정=normal). extralight·extrabold·black 금지.

### 3-2. 색 — 기존 시맨틱 토큰을 정본으로 (신규 hex 금지)
`bg-background` / `bg-surface` / `bg-card` / `bg-surface-hover` / `bg-progress-track` · `border-border(-subtle)` · `text-foreground` / `text-foreground-muted/-soft/-subtle` / `text-muted-foreground` · `bg-primary`·`text-primary`(브랜드 그린) · `text-success`(달성, WCAG AA) · `bg-destructive` · `--brand-accent-{bg,text,border}`(그린 토널).
- 차트 색은 CSS 변수(`--chart-profit` 등)를 `getComputedStyle`로 읽고, hex 폴백은 파일당 상수 1개·케이싱 통일.

### 3-3. 간격 (4px 그리드로 압축)
`1(4) · 2(8) · 3(12) · 4(16) · 6(24) · 8(32) · 12(48)` — 하프스텝은 칩/작은 버튼의 `1.5(6)`·`2.5(10)`만 예외.
기본값: 내부 `p-3~p-4` / 요소 사이 `gap-2~gap-3` / 섹션 사이 `gap-6~gap-8`.

### 3-4. Radius / Shadow (역할 확정)
- radius: `rounded-md`(입력·배지) · `rounded-lg`(버튼·작은카드) · `rounded-xl`(기본 컨테이너) · `rounded-2xl`(큰 카드·시트) · `rounded-full`(알약·아바타)
- shadow: `shadow-sm`(카드) · `shadow-md`(강조) · `shadow-lg`(드롭다운) · `shadow-xl`(모달)

---

## 4. AI 작업 규칙 (다른 프로젝트에 붙여넣기용)

- **색**: 정의된 시맨틱 토큰만. 임의 hex/`rgb()`/`hsl()`·`bg-white`·`text-black` 금지(유색 면 위 `bg-white/10` 오버레이만 예외). 장식용 그라디언트 금지. **한 화면에 primary 버튼 1개.**
- **글자**: 스케일 토큰만(caption/label/body/heading/title/display). 임의 px 금지. 본문 기본 `text-body`. 굵기 3종만 명시.
- **간격**: 4배수 스텝만(+칩용 1.5·2.5). 낱개 margin 대신 부모 `gap`/`space-y`.
- **컴포넌트**: 만들기 전 기존 확인. 버튼=`<Button>`, 카드=`<Card>`. 화면/섹션 파일에 껍데기·raw 버튼 스타일 인라인 금지.
- **레이아웃**: 모바일 우선(`md:`에서 확장), 콘텐츠 최대 폭 제한.
- **자가 점검**: 임의 hex·`text-[px]`·`bg-white` 없음 / 폰트 6단·굵기 3종 / 간격 4배수 / `<Button>`·`<Card>` / primary 1개 / 라이트·다크 대비 유지 / `globals.css` 변경 시 스타일 가이드 갱신.

---

## 5. 실제 적용한 것 + 비포/애프터

**적용(저위험·검증가능만, STEP 5 커밋 5개)**
- 타입 스케일 6토큰 신설·적용 (`@theme`)
- 공용 `<Card>` 컴포넌트 신설 (`components/ui/card.tsx`)
- 차트 색 폴백 hex 상수화·케이싱 통일 (값 불변)
- tory `bg-white` → `bg-card` 5곳 (다크모드 교정, 라이트 동일)
- 스타일 가이드에 타입 스케일·Card 데모 추가 → **비포/애프터가 눈에 보이게**

**증거**: 스타일 가이드 페이지가 5576px → **6261px**로 늘며 "역할 스케일" 6줄과 "Card(신규)" 데모가 나타남. `compare.html`에서 7화면 × desktop/mobile × light/dark 좌우 비교.
**검증**: `tsc --noEmit` 0 에러, `eslint` 0 에러, 개발 서버 전 화면 HTTP 200.

**한계(정직히)**: 인증이 필요한 화면(stats·settings·calendar·add→로그인, investment→홈)은 로그아웃 상태에서 캡처가 안 돼 **비포/애프터는 공개 7화면만**. product 화면 개선은 스크린샷으로 증명되지 않음 → 로그인 상태 눈검증 필요.

---

## 6. 산출물 · 커밋

**문서** `docs/design-system/` : `01-AUDIT.md`(진단) · `02-TOKENS.md`(토큰 설계) · `03-RULES.md`(규칙) · `SUMMARY.md`(요약) · `REPORT.md`(이 파일)
**규칙 반영**(append) : `CLAUDE.md`, `.cursorrules`
**코드** : `app/globals.css`(타입 스케일) · `components/ui/card.tsx`(신규) · `app/hooks/chart/useChartColors·useChartData.ts`(폴백 통합) · `app/components/ToryRaising/ToryRaisingFullScreen.tsx`(bg-card) · `app/components/design-system/CoreSection.tsx`(가이드 데모)
**캡처** : `capture.mjs`(Playwright, 재실행 가능) · `screenshots/before·after/`(96장) · `screenshots/compare.html`(비교 뷰어)

**커밋 9개** (모두 `docs/…`·`style/…`·`feat/…`·`refactor/…` 규칙, 로직 불변):
`docs(진단·토큰)` → `docs(규칙)` → `chore(캡처스크립트)` → `style(타입스케일)` → `refactor(차트색)` → `style(tory bg-card)` → `feat(Card)` → `style(가이드 데모)` → `docs(비포/애프터)` → `docs(SUMMARY)`

---

## 7. 다음 단계 (우선순위)

1. **로그인 상태로 product 화면 눈검증** — 특히 토리 키우기 다크모드(bg-card), 통계/설정 회귀.
2. **[최우선·재발방지] ESLint 규칙 추가** — 임의 hex·`text-[px]`·`bg-white` 금지를 린트로 강제. 문서만으로는 다시 샌다(28점의 원인).
3. **폰트 임의 px 26회 → 스케일 토큰** 치환 (`rg -n 'text-\[[0-9]' app`).
4. **raw `<button>` 121개 → `<Button>`** 점진 이관.
5. **카드 껍데기 56파일 → `<Card>`** 점진 이관.
6. `tailwind.config.ts` 정리 — Tailwind v4에서 `@config` 없이는 **미로드(vestigial)**. 연결하거나 삭제 결정.

---

## 부록. 재현 방법 (다른 프로젝트에도 이 방식 적용)

```bash
# 1. 진단 — 실측 (예시)
rg -oIN -g '*.{tsx,ts}' '#[0-9a-fA-F]{3,8}' app | sort | uniq -c | sort -rn   # 하드코딩 hex 빈도
rg -oIN -g '*.{tsx,ts}' 'text-\[[^]]+\]' app | sort | uniq -c | sort -rn      # 임의 폰트 크기
rg -c '<button' -g '*.tsx' app | sort -t: -k2 -rn                              # raw 버튼 분포

# 4/6. 비포·애프터 캡처
npm i playwright && npx playwright install chromium
node capture.mjs before      # 개발 서버(pnpm dev) 띄운 상태에서
# …토큰 적용…
node capture.mjs after
open screenshots/compare.html
```

**이 방식의 일반 원칙**: (a) 진단은 `rg` 실측만, (b) 토큰은 "N종 → M역할"로 압축·명명, (c) 규칙은 AI룰파일(.cursorrules/CLAUDE.md)에 단정형으로, (d) 적용은 새 브랜치·단계별 커밋·로직 불변·저위험 우선, (e) 눈검증 불가한 대량 치환은 보류하고 이관 지시로, (f) 재발 방지는 ESLint 강제까지 가야 완성.
