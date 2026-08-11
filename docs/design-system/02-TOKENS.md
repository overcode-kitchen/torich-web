# 02 — 디자인 토큰 설계 (Tokens)

> STEP 1 진단에서 수집한 실제 값을 근거로 설계한다.
> **핵심 판단:** 이 저장소는 색 토큰(3-Layer)이 이미 성숙하다. 따라서 색은 *재발명하지 않고* 기존 시맨틱을 **정본으로 확정**하고 통합 지점만 짚는다.
> 진짜 net-new 산출물은 **① 이름 붙은 타입 스케일 ② 간격 스케일 ③ radius/shadow 역할** — 지금까지 정의된 적 없는 세 가지다.

---

## A. 색 (Color) — 기존 시맨틱을 정본으로 확정

`globals.css`에 이미 Layer 2 시맨틱이 역할 기반 이름으로 정의돼 있다(하드코딩 hex 0). 아래가 **정본 색 토큰**이며, 신규 hex는 금지하고 이것만 쓴다.

| 토큰 | 라이트 값 | 다크 값 | 용도 | 현재 사용처 |
|---|---|---|---|---|
| `bg-background` | white | coolgray-1000 | 페이지 최하단 배경 | 루트 |
| `bg-surface` | coolgray-25 | coolgray-950 | 본문 배경(카드 아래) | `body`, 다수 |
| `bg-card` | white | coolgray-900 | 카드·모달·폼 면 | **76회 / 56파일** |
| `bg-surface-hover` | coolgray-50 | coolgray-900 | hover 면 | 다수 |
| `bg-progress-track` | coolgray-50 | coolgray-800 | 카드 위 진행바 트랙 | 2곳(신설) |
| `border-border` / `border-border-subtle` | coolgray-200 / 100 | coolgray-500 / 600 | 구분선·외곽선 | 다수 |
| `text-foreground` | coolgray-900 | coolgray-25 | 기본 텍스트 | 다수 |
| `text-foreground-muted/-soft/-subtle` | coolgray-600/700/400 | coolgray-200/100/400 | 보조 텍스트 3단 | 다수 |
| `text-muted-foreground` | coolgray-500 | coolgray-400 | 캡션·플레이스홀더 | 다수 |
| `bg-primary` / `text-primary` | brand-600 | brand-600 | 메인 CTA·브랜드 | `<Button>` default |
| `text-success` | brand-700 | brand-400 | 달성/성공 텍스트(WCAG AA) | 통계 |
| `bg-destructive` | red-500 | red-500 | 경고·삭제 | destructive |
| `--brand-accent-{bg,text,border}` | brand-50/700/200 | brand-200/600/300 | 그린 토널 배지 | soft/tonal 버튼 |

**통합이 필요한 유일한 지점 (색 값은 안 바뀜, 출처만 단일화):**

| 그룹 | 현재 흩어진 값 | 대표값/토큰으로 |
|---|---|---|
| 차트 profit 그린 | `#22C55E`, `#16A34A`, `#16a34a` (3곳·케이싱 불일치) | `--chart-profit` 폴백 상수 1개 |
| 차트 축/그리드 회색 | `#9C9EA6`, `#9c9ea6` (케이싱 불일치) | `--foreground-subtle` / `--border-subtle` 폴백 1개 |
| ToryRaising 불투명 흰 카드 | `bg-white` (284/333/403~419) | `bg-card` |
| ConcernSection 패널 | `#292A2E` | `--surface-dark` 계열 토큰(랜딩 전용 예외로 유지 가능) |

**정당한 예외(토큰화 안 함):** Google 로그인 4색, 토리 브라운 3색(`torich-brown*`은 이미 토큰).

> **색 하드코딩:** 소스 18종·약 30회 → 브랜드 예외 7종만 남기고 **나머지 11종을 토큰/폴백 상수로**. `globals.css`는 이미 0.

---

## B. 타입 스케일 (Type Scale) — **신규 정의**

지금까지 "스케일"이 이름으로 존재한 적이 없어 임의 px(26회)가 샜다. 실사용 16종(표준 9 + 임의 px 7)을 **역할 기반 6단계 + 예외 1**로 압축한다.

| 토큰 | rem / px | line-height | Tailwind 대응 | 역할 | 흡수하는 현재 값 |
|---|---|---|---|---|---|
| `text-caption` | 0.75rem / 12 | 1rem | text-xs | 캡션·메타·배지 | `text-xs`(118), `text-[11px]`(17), `text-[10px]`(3), `text-[0.8rem]`(2) |
| `text-label` | 0.875rem / 14 | 1.25rem | text-sm | 조밀 데이터·보조 라벨 | `text-sm`(223) |
| `text-body` | 1rem / 16 | 1.5rem | text-base | **본문 기본** | `text-base`(79), `text-[15px]`(2), `text-[17px]`(1) |
| `text-heading` | 1.25rem / 20 | 1.75rem | text-xl | 카드 제목·강조 | `text-xl`(19), `text-lg`(25) |
| `text-title` | 1.5rem / 24 | 2rem | text-2xl | 섹션 제목 | `text-2xl`(17) |
| `text-display` | 1.875rem / 30 | 2.25rem | text-3xl | 히어로 숫자·대형 KPI | `text-3xl`(26), `text-[34px]`(1), `text-[2rem]`(1) |
| `text-display-lg` *(예외)* | 2.25~3rem / 36~48 | — | text-4xl/5xl | 랜딩 히어로 전용 | `text-4xl`(3), `text-5xl`(3) |

> **판단 기록:** 과제는 "4~5단계"를 권했지만 **6단계**로 둔다. 이 앱은 통계·금액이 조밀한 금융 UI라 `label`(14, 데이터 조밀)과 `body`(16, 본문)와 `caption`(12, 메타)이 실제로 서로 다른 역할을 한다. 4단계로 접으면 223회의 `text-sm`을 `body`나 `caption` 중 하나로 강제 왜곡해야 해서, 정보 밀도가 무너진다. `display-lg`는 랜딩 3~5회뿐이라 "예외 티어"로 분리.

### 코드 — CSS 변수 (Tailwind v4 `@theme`, 이 프로젝트의 실제 방식)
```css
/* globals.css @theme inline 블록에 추가 */
--text-caption: 0.75rem;      --text-caption--line-height: 1rem;
--text-label: 0.875rem;       --text-label--line-height: 1.25rem;
--text-body: 1rem;            --text-body--line-height: 1.5rem;
--text-heading: 1.25rem;      --text-heading--line-height: 1.75rem;
--text-title: 1.5rem;         --text-title--line-height: 2rem;
--text-display: 1.875rem;     --text-display--line-height: 2.25rem;
--text-display-lg: 2.25rem;   --text-display-lg--line-height: 2.5rem;
/* → text-caption, text-body, text-display … 유틸리티가 생성됨 */
```

### 코드 — Tailwind Config (레거시 호환)
```ts
// tailwind.config.ts › theme.extend
fontSize: {
  caption:      ['0.75rem',  { lineHeight: '1rem' }],
  label:        ['0.875rem', { lineHeight: '1.25rem' }],
  body:         ['1rem',     { lineHeight: '1.5rem' }],
  heading:      ['1.25rem',  { lineHeight: '1.75rem' }],
  title:        ['1.5rem',   { lineHeight: '2rem' }],
  display:      ['1.875rem', { lineHeight: '2.25rem' }],
  'display-lg': ['2.25rem',  { lineHeight: '2.5rem' }],
},
```

> **font-weight**: `font-normal`/`medium`/`semibold`/`bold` **4단만** 허용. `extralight`·`extrabold`·`black` 금지. (현재 `extrabold` 3회·`normal` 9회가 이탈.)

> **폰트 크기: 16종 → 6 역할(+1 예외).** 임의 px 26회 → 0.

---

## C. 간격 스케일 (Spacing) — **4px 그리드로 압축**

실사용 magnitude 17종(하프스텝 포함)을 **7 primary 스텝 + 2 승인된 micro**로 압축한다. Tailwind v4의 spacing은 동적이라 *값을 재정의(breaking)하지 않고*, "이 스텝만 쓴다"는 규칙 + 문서로 강제한다.

| 스텝 | px | Tailwind | 용도 |
|---|---|---|---|
| `1` | 4 | `p-1 gap-1` | 아이콘-텍스트 최소 간격 |
| `2` | 8 | `p-2 gap-2` | 컴포넌트 내부 조밀 |
| `3` | 12 | `p-3 gap-3` | **기본 내부 간격(최다)** |
| `4` | 16 | `p-4 gap-4` | 카드 패딩 기본 |
| `6` | 24 | `p-6 gap-6` | 카드 넉넉 패딩·요소 사이 |
| `8` | 32 | `p-8 gap-8` | 섹션 사이 |
| `12` | 48 | `py-12` | 페이지 상하 여백 |
| `1.5` *(micro)* | 6 | `gap-1.5 py-1.5` | 인라인 칩·배지 전용(승인) |
| `2.5` *(micro)* | 10 | `px-2.5` | 작은 버튼 좌우(승인) |

**기본값 규칙:** 컴포넌트 **내부** = `p-3`~`p-4` / 요소 **사이** = `gap-2`~`gap-3` / 섹션 **사이** = `gap-6`~`gap-8`.
**정리 대상:** `0.5`(2px)·`3.5`(14px)·산발 임의 px(`h-[3px]` 등)는 최근접 스텝으로. `mb-*` 대신 부모 `gap`/`space-y` 우선.

> **간격: magnitude 17종 → 7 primary(+2 micro).** 하프스텝 남용 약 125회를 대폭 축소.

---

## D. Radius — 기존 `--radius` calc 재사용, **역할만 확정**

`globals.css`에 이미 `--radius`(0.625rem) 기반 sm~4xl calc가 있다. 값은 그대로 두고 **어디에 무엇을** 쓸지 고정한다.

| 역할 | 클래스 | 용도 | 현재 |
|---|---|---|---|
| 입력·배지 | `rounded-md` | input·badge·small chip | 32회 |
| 버튼·작은 카드 | `rounded-lg` | button·list item | 33회 |
| **기본 컨테이너** | `rounded-xl` | 대부분 카드 | **88회** |
| 큰 카드·시트 | `rounded-2xl` | 강조 카드·바텀시트 상단 | 73회 |
| 알약·아바타 | `rounded-full` | pill·avatar·토글 | 80회 |

> `rounded-3xl`(7)·임의 `rounded-[40px]`는 `2xl` 또는 `full`로 흡수. **8종 사용 → 5 역할.**

## E. Shadow — 4 역할로 압축

| 역할 | 클래스 | 용도 | 현재 |
|---|---|---|---|
| `shadow-card` | `shadow-sm` | 기본 카드 살짝 띄움 | 15회 |
| `shadow-raised` | `shadow-md` | hover·강조 카드 | 11회 |
| `shadow-overlay` | `shadow-lg` | 드롭다운·팝오버 | 14회 |
| `shadow-modal` | `shadow-xl` | 바텀시트·모달 | 10회 |

> `shadow-xs`(5)는 `shadow-card`로 흡수. **5종 → 4 역할.**

---

## 통합 효과 요약 (N → M)

| 항목 | 지금 (N) | 토큰 통합 후 (M) |
|---|---|---|
| 소스 하드코딩 hex | 18종 / ~30회 | **브랜드 예외 7종** (나머지 11종 → 토큰/폴백 상수) |
| `globals.css` hex | 0 | 0 (유지) |
| 폰트 크기 | 16종 (표준9 + 임의px 7) | **6 역할** (+1 예외 티어) · 임의 px 26회 → 0 |
| font-weight | 5종 | **4단** |
| 간격 magnitude | 17종 (+하프스텝 125회) | **7 primary** (+2 승인 micro) |
| radius | 8종 사용 | **5 역할** |
| shadow | 5종 | **4 역할** |
| 버튼 구현 | 2방식 (공용70 / raw121) | **1 컴포넌트** |
| 카드 껍데기 | 56파일 인라인 | **1 `<Card>` 컴포넌트** |
