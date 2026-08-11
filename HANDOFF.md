# HANDOFF — 토리치 (torich-web)

> 이 파일은 재진입 노트다. 세션 시작 시 훅이 자동으로 읽어준다.
> 돌아오면 `/catchup` 으로 이 파일 + git 상태를 브리핑받고 시작하라.
> _마지막 갱신: 2026-07-28 · 브랜치: style/104-goal-pace-ui_

## 🎯 지금 목표 (한 줄)
이슈 #104 — '목표별 페이스' 섹션 UI 리디자인. **A안(목적당 카드 1장 + 모은 금액) 구현 완료**, 남은 건 실기기 눈검증 → `build:app` → PR(base `integration`).

## ✅ 마지막으로 한 것 (이번 세션)
- **A안 채택·구현**(#104). Claude 시안 3안(A 금액으로 채우기 / B 패널 낮추기 / C 전폭 배너) 중 A안 승인받아 진행. 시안 아트팩트: https://claude.ai/code/artifact/306ed04f-7cf3-490b-b710-939af7833c0b
- 한 카드 안 `ul`+구분선 → **목적 하나당 흰 카드 하나**(`rounded-2xl bg-card p-5`, 카드 간 `gap-3`).
- **목적명·D-day를 카드 머리로 승격** → 우측 상단 빈 자리 제거. 그 자리에 **모은 금액 / 목표 금액** 추가하고 우측을 `justify-between`으로 위아래로 벌려 채움.
- 그린 패널 **132 → 118px**, 컬럼 `132px_1fr` → `118px_1fr`.
- `shortWon()` 신설(`app/utils/goal-format.ts`) — `120만원` / `3,000만원` / `1억 2,000만원`. 만원 미만은 원 단위 그대로.
- **다크모드 버그 수정**: 진행바 트랙 `bg-surface-hover`가 다크에서 카드(`bg-card`)와 같은 coolgray-900이라 안 보였다. `--progress-track` 시맨틱 신설(라이트 coolgray-50 / 다크 coolgray-800) 후 '목표별 페이스'와 '목적 진척' 두 곳 교체. globals.css를 고쳤으므로 `CoreSection.tsx` 컬러 목록에도 토큰 추가.
- 커밋 4개(`1174dcb` `ab0cab8` `77caf6d` `bd6ea7a`) + 이 노트.

## 📍 지금 상태
- 빌드/실행: `tsc --noEmit` ✅, `eslint`(변경 파일) ✅, 웹 dev 눈검증 ✅. **`build:app` 정적 export는 아직 안 돌림** — 라우팅/env 무변경(순수 스타일)이라 스킵. PR 열기 전에 돌릴 것.
- 워크트리: `tickle-moa-w-B`에서 작업 중. 웹 확인은 이 워크트리의 dev 서버 `http://localhost:3002/stats` (3000=tickle-moa, 3001=워크트리 A가 점유).
- 담당자: #104 @me 지정됨. PR은 아직 안 열음.

## ⏭️ 다음 할 일 (우선순위 순)
1. **실기기 눈검증**: Xcode 빌드 → 통계 탭 '목표별 페이스'. ① 118px 패널에 도토리 쏟겨 쌓이는지 ② 달성% 흰 글자 가독성 ③ 카드 분리 후 스크롤 길이 ④ 다크모드 그린 명도·기한 바 트랙.
2. **캘리브레이션(필요 시)**: 도토리 크기 `SPRITE_SCALE=2.7`(`app/utils/acorn-physics.ts`) — 패널이 줄었지만 웹에서는 그대로 두기로 결정, 기기에서 재판단. 그린 명도는 `app/globals.css` `--goal-well`.
3. **PR 오픈**(base `integration`) → CI verify. 열기 전 `pnpm run build:app`로 localhost 누출 0·라우팅 확인.
4. **머지**: 담당자 판단, CI 통과 후 Squash.

## 🧭 결정과 이유 (이번 세션)
- **목적당 카드 1장** — 왜: 사용자 요청. 좌 그린패널/우 정보 2단에서 우측 상단에 큰 빈 자리가 생기던 문제를, 목적명·D-day를 카드 머리로 올려 구조적으로 없앴다.
- **우측에 모은 금액 추가(A안)** — 왜: 남는 세로 공간을 여백으로 두지 않고 정보로 채운다. '목적 진척' 섹션이 원 단위 전체를 이미 보여주므로, 여기선 `shortWon` 만원 축약을 써서 두 섹션이 같은 말로 읽히지 않게 했다.
- **섹션 제목·기울이기 토글을 카드 밖으로** — 왜: 한 번 반려됐다가 근거를 확인하고 유지하기로 한 지점이다. 앱의 규칙은 "제목은 흰 카드 안"이 아니라 **"한 섹션 = 한 카드면 안에, 섹션이 카드 여러 장으로 쪼개지면 밖에(`px-1`)"** 쪽이고, 그 선례가 `app/components/FAQSections/FAQList.tsx:16`(카드 밖 제목 + `bg-card` 카드 n장)이다. 설정 화면이 제목을 안에 두는 것도 한 섹션 = 한 카드이기 때문. 제목 자체를 없애는 안은 버렸다 — 바로 옆 '목적 진척'이 같은 목적들을 다르게 보여줘서 이름이 없으면 왜 두 번 나오는지 안 읽히고, 기울이기 토글도 갈 곳이 없다.
- **`--progress-track` 신설** — 왜: 다크에서 `surface-hover`와 `card`가 같은 coolgray-900이라 트랙이 사라진다. 두 값을 한 토큰으로 겸하는 게 원인이라 역할을 분리했다.

## 🚧 막힌 것 / 열린 질문
- 그린 명도·도토리 크기·패널 높이(118px)는 **웹 기준 잠정값**. 실기기에서 조정 가능성.
- `app/components/ToryRaising/ToryRaisingGrowthSection.tsx:67`에도 `bg-surface-hover` 트랙이 있다. 거긴 `border-border-subtle`가 있어 다크에서도 윤곽이 보여 손대지 않았다. 정리하려면 별도 이슈.

## ▶️ 바로 이어가려면
`git checkout style/104-goal-pace-ui`. 웹이면 `pnpm dev`(이 워크트리는 3002) 후 통계 탭. 앱이면 Xcode 빌드 → 눈검증(위 1번). 값 조정 위치: 레이아웃(패널 높이·컬럼·금액 표기) `app/components/StatsSections/GoalPaceSection.tsx`, 그린 `app/globals.css`의 `--goal-well`, 도토리 크기 `app/utils/acorn-physics.ts`의 `SPRITE_SCALE`. 시안은 위 아트팩트 링크 참고.
