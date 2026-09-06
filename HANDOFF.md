# HANDOFF — 토리치 (torich-web)

> 이 파일은 재진입 노트다. 세션 시작 시 훅이 자동으로 읽어준다.
> 돌아오면 `/catchup` 으로 이 파일 + git 상태를 브리핑받고 시작하라.
> _마지막 갱신: 2026-09-06 13:02 · 브랜치: feat/271-v2-main-flow_

## 🎯 지금 목표 (한 줄)
**v2 메인 플로우를 폰에서 눌러보고 판단한다.** `/v2` 4화면 구현 완료 · [PR #272](https://github.com/overcode-kitchen/torich-web/pull/272) 오픈 · **남은 건 실기기 눈검증**.

## ✅ 마지막으로 한 것 (이번 세션)
- **미결 질문 3건을 닫았다**(#246). Q1 계획 채움 → `이번 달 현황` 안 한 줄로 흡수 / Q2 화면 내 금액 가리기 → **삭제** / Q3 브랜드 스토리 → 홈에서 빼고 **설정 진입만**. `docs/v2/06-constraints.md` 가 "확정 — 미결 없음"이 됐다.
- **일정 문서를 471줄 → 143줄로 줄였다**(`docs/v2/02-schedule.md`). 날짜별 표를 앞으로 올리고, 진단·원칙·GA 콘솔 설명·리스크 표를 덜어냈다(전부 01·04·ga4-console-guide에 이미 있다).
- **모션 권한 스파이크를 블로커에서 뺐다.** 연출 안의 입력 방식 하나 고르는 문제라 기획을 막지 않는다 → Phase 3으로 옮김.
- **클릭 프로토타입**(아티팩트)을 만들고 거기서 나온 발견 3건을 `06-constraints.md §5-1`에 남겼다.
- **`/v2` 4화면을 실제 앱에 구현했다**(#271) — 온보딩 A/B 분기 · 담기 · 홈 · 설정. 진짜 토큰·`<Button>`·`<Card>` 사용. 기존 화면은 하나도 안 건드렸다.

## 📍 지금 상태
- 빌드/실행: `tsc --noEmit` ✅ · `eslint`(신규 파일) ✅ · `pnpm lint:design` ✅ 차단 위반 0 · `build:app` ✅ — `out/`에 `v2.html`·`v2/{onboarding,add,settings}.html` 생성 확인. `server-routes.backup/` 잔여 없음, `app/api`·`app/auth` 복구됨.
- 미커밋 변경: **없음**(전부 커밋·푸시됨). 워킹 트리에 `토리치-소개-블로그-글감.md`(8/18 작성) 하나가 untracked로 남아 있는데 **이번 작업과 무관** — 커밋할지 미정.
- 브랜치 2개가 살아 있고 **둘 다 PR이 열려 있다**: `docs/246-roadmap-2026h2` → [PR #265](https://github.com/overcode-kitchen/torich-web/pull/265) · `feat/271-v2-main-flow` → [PR #272](https://github.com/overcode-kitchen/torich-web/pull/272).

## ⏭️ 다음 할 일 (우선순위 순)
1. **실기기 눈검증** — `pnpm dev:app` 실행 → 폰 사파리 `http://<맥IP>:3000/v2`. 볼 것: ① 1억 카운터 카운트업이 실제로 읽히는가 ② 그린 패널 위 흰 글자 가독성(라이트·다크) ③ 항목 "내리기" 후 회색 무표정이 벌주는 느낌인가 ④ safe area 이중 적용 없는가 ⑤ 담기 폼에서 아래가 열리는 게 자연스러운가
2. **PR #272 CI 확인 후 머지 판단** (base `integration`, Squash). 머지되면 로컬 브랜치 정리.
3. **[PR #265](https://github.com/overcode-kitchen/torich-web/pull/265) 처리** — 기획 문서 브랜치(`docs/246-roadmap-2026h2`)의 PR. 이번 세션 커밋 4개가 여기 들어가 있다.
4. **문서 정합성 2건** (아직 안 함) — ① 브리프 §9의 "통계 23섹션" → 실측 **9섹션**으로 수정 ② 전역 시작 잔액·목표 금액이 목적 단위라 스키마 작업 필요, Phase 2.5 범위에 넣을지 확정
5. 무니 숙제: 앱스토어 **키워드 안** · **개인정보 처리방침 개정 범위** (심사 전 필수)

## 🧭 결정과 이유 (이번 세션)
> 오래 갈 결정은 전부 `docs/v2/03-decisions.md`(정본)에 `[x]`로 남겼다. 아래는 스냅샷이다.

- **화면 내 금액 가리기 삭제** — 왜: 1억 카운터가 홈의 1번 요소가 되면 가리기 버튼은 *1번 요소를 지우는 버튼*이 된다. 공유 시 비노출(§8)이 어깨너머 걱정을 대신 받는다. **DB 컬럼 `user_settings.show_monthly_amount`는 남긴다** — 구버전 앱을 깨는 Breaking Change다. 토글 UI만 제거, 실행은 Phase 2.5.
- **계획 채움을 홈 `이번 달 현황` 안 한 줄로** — 왜: 담기 폼에만 두면 홈에서 이번 달에 뭘 더 해야 하는지 모르고, 따로 블록을 세우면 예산이 5가 된다. **형태를 같이 못박았다** — 금액 문장 한 줄, %·게이지·바 금지, 다 채운 달과 계획 건너뛴 사람에겐 안 뜬다.
- **`이번 달 현황`과 `적립 항목 목록`을 합쳤다** — 왜: 브리프 §3은 둘로 나눴는데 실제로 그려보니 같은 목록이라, 나누면 같은 항목이 두 번 나와 N-08에 걸린다. 홈 블록은 3이 됐고 남는 한 칸은 **비워둔다**.
- **localStorage를 `useSyncExternalStore`로 붙였다** — 왜: `useEffect` + `setState`는 `react-hooks/set-state-in-effect` 린트에 걸리고 하이드레이션이 어긋난다. 외부 저장소로 붙이면 서버 렌더와 첫 클라이언트 렌더가 같고 `/v2`와 `/v2/add`가 같은 값을 본다.
- **v2를 별도 앱이 아니라 같은 저장소 `/v2` 경로로** — 왜: 진짜 토큰·컴포넌트로 봐야 판단이 서고, 9/7 구현 W1이 정확히 이 범위라 버리는 코드가 아니다. 되면 `/v2` → `/` 승격, 아니면 폴더 삭제.

## 🚧 막힌 것 / 열린 질문
- **담기 화면 숫자 상한이 1이라** 브리프 §6의 `1억까지 +0.4%`와 계획 채움 중 하나만 된다. 지금은 계획 채움을 남겼다 — 퍼센트를 살리려면 **상한을 2로 올려야 한다**(06 §5-1 3번).
- **`100만원 중 60만원 채움 · 40만원 남음` 한 줄에 금액이 셋**인데, 이걸 1로 셀지 3으로 셀지 §2에 세는 규칙이 없다. 지금은 "한 문장 = 한 숫자"로 셌다.
- **IA 캔버스에 새 화면을 이어 그리는 건 아직 안 했다.** 아트보드 12장이 2.4MB 파일 하나에 통째로 들어 있어, 보드를 추가하려면 12장을 다시 심어 같은 링크로 덮어써야 한다. 12장 백업은 scratchpad에 떠뒀지만 **세션이 끝나면 사라진다** — 다시 하려면 캔버스를 다시 받아야 한다.

## ▶️ 바로 이어가려면
```bash
git checkout feat/271-v2-main-flow
pnpm dev:app          # 맥 LAN IP 자동 감지, 3000 포트
```
폰 사파리에서 `http://<맥IP>:3000/v2` → 온보딩부터 눌러본다. 값이 꼬이면 `/v2/settings` → "처음부터 다시".
고칠 위치: 카운터 `app/components/V2Sections/V2Counter.tsx` · 이번 달 목록 `V2MonthlyBlock.tsx` · 담기 폼 `V2AddView.tsx` · 상태 `app/hooks/v2/useV2Sandbox.ts`.

**참고 링크** — [PR #272](https://github.com/overcode-kitchen/torich-web/pull/272) · [PR #265](https://github.com/overcode-kitchen/torich-web/pull/265) · [이슈 #271](https://github.com/overcode-kitchen/torich-web/issues/271) · [클릭 프로토타입](https://claude.ai/code/artifact/9dc25652-2c47-4d80-9a7c-70a4f492f04c) · [IA 캔버스](https://claude.ai/code/artifact/7fb4247b-c6e4-4ed0-910d-ecf3eb686172) · 문서 지도 [docs/v2/README.md](docs/v2/README.md)
