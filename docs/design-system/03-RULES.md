# 03 — AI UI 작업 규칙 (Design Rules)

> `02-TOKENS.md`를 근거로, 앞으로 UI를 만들 때 따르는 규칙. 단정형으로 적는다.
> 이 파일이 정본이며, `CLAUDE.md`·`.cursorrules`의 "디자인 규칙" 섹션은 이 요약을 참조한다.

## 색

- 정의된 시맨틱 토큰만 쓴다: `bg-background` `bg-surface` `bg-card` `border-border` `text-foreground` `text-muted-foreground` `text-foreground-soft/-subtle` `bg-primary` `text-success` `bg-destructive`.
- 임의 hex/`rgb()`/`hsl()`를 className·style에 쓰지 않는다. 색이 필요하면 토큰을 추가하고 토큰을 쓴다.
- `bg-white` `text-black` `bg-black`을 직접 쓰지 않는다. 흰 면은 `bg-card`, 검은 텍스트는 `text-foreground`다. (유색 면 위 반투명 오버레이 `bg-white/10`는 예외.)
- 그라디언트를 장식으로 쓰지 않는다. 허용되는 그라디언트는 ① 페이드 마스크 ② 토큰화된 브랜드 패널(`--goal-well`)뿐이다.
- 차트 색은 CSS 변수(`--chart-profit` 등)를 `getComputedStyle`로 읽는다. hex 폴백이 필요하면 파일당 상수 1개로 두고 케이싱을 통일한다.
- 한 화면에 primary(브랜드 그린) 버튼은 **1개**다. 나머지는 `secondary`·`soft`·`ghost`·`outline`.
- 통계·폼 등 정보 UI는 coolgray 톤으로 위계를 만든다. 브랜드 그린은 한두 지점에만.

## 글자

- 정의된 타입 스케일만 쓴다: `text-caption`(12) `text-label`(14) `text-body`(16) `text-heading`(20) `text-title`(24) `text-display`(30). 랜딩 히어로만 `text-display-lg`.
- 임의 px(`text-[11px]`, `text-[2rem]` 등)를 쓰지 않는다. 스케일 사이 값이 필요하면 최근접 토큰으로 맞춘다.
- 본문 기본은 `text-body`(16). 조밀한 데이터·보조 라벨에만 `text-label`(14)·`text-caption`(12)을 쓴다.
- 굵기는 `font-medium` `font-semibold` `font-bold` 3종만 명시한다. 본문은 weight를 지정하지 않는다(normal 기본). `extralight`·`extrabold`·`black` 금지.
- 헤딩은 `tracking-tight`을 붙인다.

## 간격

- 4의 배수 스텝만 쓴다: `1`(4) `2`(8) `3`(12) `4`(16) `6`(24) `8`(32) `12`(48).
- 하프스텝은 인라인 칩/작은 버튼에서 `1.5`(6)·`2.5`(10)만 예외 허용. `0.5`·`3.5`는 쓰지 않는다.
- 기본값: 컴포넌트 **내부** 패딩 `p-3`~`p-4` / 요소 **사이** `gap-2`~`gap-3` / 섹션 **사이** `gap-6`~`gap-8`.
- 낱개 `mt-*`/`mb-*`로 간격을 만들지 않는다. 부모에 `gap`/`space-y`를 준다.

## 컴포넌트

- 새 컴포넌트를 만들기 전에 `components/ui`와 `app/components`에 같은 역할이 있는지 확인한다.
- 버튼은 `<Button>`(`@/components/ui/button`)을 쓴다. raw `<button>`에 스타일을 인라인하지 않는다. variant: `default`(primary CTA)·`secondary`·`soft`·`tonal`·`ghost`·`outline`·`destructive`·`link`.
- 카드는 `<Card>`(`@/components/ui/card`)를 쓴다. `<div className="rounded-2xl bg-card ...">`를 화면 파일에 복붙하지 않는다.
- 화면(`page.tsx`)·섹션 파일에서 토큰 조합을 직접 스타일링하지 않는다. 반복되면 컴포넌트로 승격한다.

## 레이아웃

- 모바일 우선으로 만든다(기본 스타일 = 모바일, `md:` 이상에서 확장).
- 콘텐츠 최대 폭을 제한한다(중앙 정렬 컨테이너). 전폭으로 늘어지게 두지 않는다.
- `globals.css`·타입·기본 UI 컴포넌트를 고치면 `app/design-system` 스타일 가이드를 즉시 갱신한다.

## 작업 후 자가 점검 체크리스트

- [ ] className/style에 임의 hex·`text-[..px]`·`bg-white`·`text-black`이 없는가
- [ ] 폰트 크기가 6단 스케일 토큰인가 / 굵기가 3종 이내인가
- [ ] 간격이 4배수 스텝(+승인 micro)인가
- [ ] 버튼은 `<Button>`, 카드는 `<Card>`인가 (raw 껍데기 복붙 없음)
- [ ] 한 화면에 primary 버튼이 1개인가
- [ ] 라이트/다크 둘 다에서 대비가 살아있는가 (특히 카드 위 트랙·보조 텍스트)
- [ ] `globals.css`를 고쳤다면 `app/design-system` 가이드를 갱신했는가
