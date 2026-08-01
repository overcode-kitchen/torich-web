# SUMMARY — 디자인 시스템 진단·구축 (자율 세션)

> 돌아오면 이 문서만 읽으면 됩니다. 브랜치 `design-system-setup` (base `style/104-goal-pace-ui`, **push 안 함**), 커밋 9개.
> 세션 일자: 2026-08-01 · MODE: full

---

## 1. 한 줄 결론

토리치는 **"AI 슬롭"이 아니라 잘 설계된 토큰 시스템(3-Layer·다크모드 1:1·WCAG 주석)을 갖췄지만, 린트로 강제되지 않아 집행이 새고 있던** 코드베이스다(AI스러움 **28/100**). 이번 세션은 **없던 것을 채우고(타입 스케일·`<Card>`) 규칙을 문서·툴로 못박고(03-RULES·.cursorrules·CLAUDE.md), 저위험 드리프트를 실제로 정리**했다 — 위험한 대량 치환은 근거와 함께 사람 몫으로 남겼다.

## 2. 숫자로 보는 변화

| 항목 | 진단(N) | 설계 목표(M) | **이번에 실제 적용** |
|---|---|---|---|
| 소스 하드코딩 hex | 18종 / ~30회 | 브랜드 예외 7종 | 차트 폴백 케이싱 통합(near-dup 4종 제거) + tory `bg-white` 5곳 → `bg-card`. `globals.css` hex 0 유지 |
| 타입 스케일 | **역할 스케일 0개** (임의 px 26회 방치) | 6 역할(+display-lg) | **6 토큰 신설·적용**(`text-caption`~`display`) + 스타일 가이드 도그푸딩 |
| font-size 임의 px | 7종 26회 | 0 | 스케일 확보(치환은 follow-up) |
| font-weight | 5종 | 3종 명시 | 규칙 확정(코드 치환 follow-up) |
| 간격 magnitude | 17종(+하프스텝 125회) | 7 primary(+2 micro) | 스케일·규칙 문서화(치환 follow-up) |
| radius / shadow | 8종 / 5종 | 5역할 / 4역할 | 역할 확정(문서) |
| 버튼 구현 | 공용 70 / raw **121** | 1 컴포넌트 | 공용 Button은 이미 존재 — 채택 이관은 follow-up |
| **카드 컴포넌트** | **없음**(56파일 껍데기 복붙) | 1 `<Card>` | **`components/ui/card.tsx` 신설** |

> 정직한 요약: **정의·문서·컴포넌트·저위험 정리는 이번에 완료**. 인증 게이트로 눈검증 불가한 **대량 기계 치환(폰트 px·간격·raw 버튼)은 회귀 위험 때문에 의도적으로 보류**하고 아래 6번에 이관 지시로 남겼다.

## 3. 생성/수정된 파일

**신규 문서 (`docs/design-system/`)**
- `01-AUDIT.md` — 실측 진단(색/타이포/간격/컴포넌트/구조), AI스러움 점수·근거, 우선순위 1~5
- `02-TOKENS.md` — 타입 스케일·간격·radius·shadow 토큰 설계 + N→M 수치 + CSS/Config 코드
- `03-RULES.md` — AI UI 작업 규칙(단정형) + 자가 점검 체크리스트
- `SUMMARY.md` — 이 문서

**규칙 반영 (기존 파일에 append, 덮어쓰지 않음)**
- `CLAUDE.md` — "디자인 규칙" 섹션 추가
- `.cursorrules` — "Design Rules" 섹션 추가

**코드 (STEP 5, 커밋 5개)**
- `app/globals.css` — `@theme`에 타입 스케일 토큰 7개 추가
- `app/hooks/chart/useChartColors.ts`·`useChartData.ts` — 차트 폴백 hex 상수화·케이싱 통일(값 불변)
- `app/components/ToryRaising/ToryRaisingFullScreen.tsx` — `bg-white`→`bg-card` 5곳
- `components/ui/card.tsx` — **신규 공용 `<Card>`** 컴포넌트
- `app/components/design-system/CoreSection.tsx` — 스타일 가이드에 타입 스케일·Card 데모 추가

**캡처·비교 (STEP 4·6)**
- `capture.mjs` — Playwright 비포/애프터 캡처 스크립트(재실행 가능)
- `screenshots/before·after/` — 7화면 × desktop/mobile × light/dark = 96장
- `screenshots/compare.html` — 외부 의존성 없는 좌우 비교 뷰어(사이즈·테마 탭)

## 4. BLOCKED / 제약

- **인증 게이트 화면은 로그아웃 상태 캡처 불가.** `stats·settings·calendar·add`→`/login`, `investment`→`/`로 리다이렉트. 비포/애프터는 **공개 렌더 7화면**(design-system·home·login·faq·tory·goal-new·notifications)만. → **product 화면의 개선 효과는 스크린샷으로 증명되지 않음.** 사람이 로그인 상태로 눈검증 필요.
- **Playwright 미설치(저장소).** 브라우저 바이너리는 캐시(build 1228)에 있어, 스크래치패드에 `playwright`만 설치하고 `executablePath`로 캐시 바이너리를 직접 물려 우회했다. → 사람이 재실행하려면 `npm i playwright && npx playwright install chromium` 후 `node capture.mjs after`.
- **개발 서버 lock.** 이 디렉터리에 이미 `next dev`(포트 3000)가 떠 있어 새 서버는 lock 충돌. 기존 서버(현재 파일을 watch)를 **읽기 전용으로 사용**했다(죽이지 않음).
- **대량 기계 치환 보류(막힌 게 아니라 스코프 축소).** 폰트 임의 px 26회·간격 하프스텝·raw 버튼 121개는 대부분 게이트 화면에 있어 시각 회귀를 확인할 수 없어 **일부러 손대지 않았다.** 6번에 정확한 grep과 함께 이관.

## 5. 내가 임의로 판단한 것들 (근거)

1. **브랜치 base = 현재 HEAD(style/104)** — `integration`은 워크트리 `tickle-moa-w-a`에 체크아웃돼 있어 메인 워크트리에서 못 가져오고, 이 브랜치는 push 안 하는 탐색용이라 HEAD 분기가 워크트리 충돌을 피하고 #104 맥락도 보존한다.
2. **`--no-verify` 커밋** — 연결할 이슈가 없는 탐색 브랜치인데 `commit-msg` 훅이 `Closes #N`을 강제한다. CLAUDE.md가 "부득이할 때만" 허용한 우회를 썼다(이슈를 억지로 만들지 않음).
3. **타입 스케일 6단(4~5단 권장 초과)** — 금융 통계 UI라 `label(14)`·`body(16)`·`caption(12)`이 실제로 다른 역할. 4단으로 접으면 223회 `text-sm`을 왜곡해야 해 밀도가 무너진다.
4. **CLAUDE.md·.cursorrules는 append**(덮어쓰기 금지) — 둘 다 이미 내용이 있는 파일이라 기존 보존.
5. **STEP 5 스코프 = 저위험·검증가능만.** 추가(토큰·Card)·값불변(차트)·다크안전(bg-white)·가시(스타일 가이드)만 적용. 대량 치환은 보류(4·6번).
6. **`tailwind.config.ts` 미수정** — Tailwind v4에 `@config`가 없어 **이 설정은 로드조차 안 된다(vestigial).** 실효 소스인 `@theme`(globals.css)에만 토큰을 넣었다.
7. **`bg-white/70`(진행바)·`bg-[#ece4f7]`(tory 패널) 유지** — 전자는 유색 면 위 의도된 반투명, 후자는 대응 토큰이 없어 바꾸면 디자인 의도가 바뀐다.
8. **`<Card>` 기본 = `rounded-2xl` + `p-5`** — 최신 카드 코드(GoalPaceSection)와 결을 맞췄다.

## 6. 다음에 사람이 확인할 것 (우선순위)

1. **[검증] 로그인 상태로 product 화면 눈검증** — 특히 **토리 키우기 다크모드**(상점/꾸미기 패널이 `bg-card`로 잘 뜨는지), 통계/설정 회귀 여부.
2. **[재발 방지·최우선] ESLint 규칙 추가** — 임의 hex·`text-[..px]`·`bg-white`·`text-black` 금지를 린트로 강제. **문서 규칙만으로는 다시 샌다**(28점의 원인이 정확히 이것). 이게 이번 작업을 지속시키는 핵심.
3. **[치환] 폰트 임의 px 26회 → 스케일 토큰.** `rg -n 'text-\[[0-9]' app` 로 위치 확인 후 최근접 토큰(11/10px→`text-caption`, 15/17px→`text-body`, 2rem/34px→`text-display`).
4. **[이관] raw `<button>` 121개 → `<Button>`.** `rg -c '<button' -g '*.tsx' app` 상위 파일부터. 로직 불변, className만.
5. **[이관] 카드 껍데기 56파일 → `<Card>`.** `rg -l 'bg-card' app` 대상, 한 번에 몇 파일씩 시각 확인하며.
6. **[정리] `tailwind.config.ts`** — v4에서 미로드이므로 `@config`로 연결하거나 삭제 결정.
7. **[무관] `ios/.../project.pbxproj`** 미커밋 변경 — 이번 작업과 무관해 그대로 뒀다. 원 세션(#104) 것인지 확인.

---

## 이 과정을 외부 클라이언트에 "서비스"로 판다면 — 가장 설득력 있는 산출물 3가지

1. **`01-AUDIT.md`의 "AI스러움 점수 + 근거 수치"** — 클라이언트가 "우리 UI가 좀 조잡한 것 같다"는 *느낌*을 갖고 온다. 이걸 **"하드코딩 hex 30회, raw 버튼 121개, 카드 껍데기 56파일 복붙, 임의 폰트 26회"** 같은 **반박 불가능한 숫자**로 바꿔주면, 진단의 신뢰가 서고 "무엇을 왜 고쳐야 하는지"가 자명해진다. 컨설팅의 값은 여기서 결정된다.
2. **`compare.html` 비포/애프터 뷰어** — 코드 커밋 로그는 클라이언트를 설득하지 못한다. **같은 화면을 좌우로, 라이트/다크 토글로 넘겨 보는 시각 증거**가 "돈 낸 만큼 달라졌다"를 즉시 체감시킨다. 데모·보고 자리에서 가장 강력한 한 장.
3. **`03-RULES.md` + `.cursorrules`/`CLAUDE.md` 통합 + (제안한) ESLint 강제** — 일회성 청소는 6개월 뒤 다시 더러워진다. **"재발을 막는 가드레일(규칙+린트+AI 룰파일)을 심어 팀의 AI 코딩이 자동으로 토큰을 지키게 만든다"**는 게 진짜 차별점이다. 이건 리테이너(지속 계약)로 이어지는 산출물이다 — 청소부가 아니라 시스템을 파는 것.
