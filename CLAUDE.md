# 토리치 프로젝트 가이드 (CLAUDE.md)

## Language
- Always respond in Korean (한국어로 응답)

## 작업 절차 (코드를 고치기 전에 읽는다)

이 저장소는 팀원 전원이 Claude CLI로 작업한다. **코드 변경은 아래 순서를 벗어나지 않는다.**
상세 배경은 [docs/workflow.md](docs/workflow.md), 여기는 실행 순서만 적는다.

1. **이슈부터.** 연결할 이슈가 없으면 코드를 건드리기 전에 먼저 만든다.
   마일스톤은 "지금 나가야 하나?"로 고른다 — 다음 배포면 진행 중인 버전(`v1.3.0` 등), 언젠가면 비워둔다.
2. **담당자를 지정한다** (`gh issue edit <N> --add-assignee @me`).
   이걸 해야 보드가 `진행중`으로 바뀌고 `진행중` 라벨이 붙는다. **빠뜨리면 남들이 뭘 잡았는지 알 수 없다.**
3. **브랜치를 판다.** `integration`에서 분기하고 이름은 `type/이슈번호-설명`.
   ```bash
   git checkout integration && git pull && git checkout -b fix/58-chart-loss
   ```
   `main`·`integration`에서 바로 커밋하지 않는다 (`commit-msg` 훅이 경고한다).
4. **커밋한다.** 마지막 줄에 `Closes #N` — 아래 [이슈 연동](#이슈-연동-필수) 참고.
5. **PR을 만든다.** base는 반드시 `integration`.
6. **머지는 담당자가 정한다.** 지시받으면 수행하고, 아니면 PR 링크와 CI 결과를 보고하고 멈춘다.
   머지할 때는 **CI 통과를 확인한 뒤 Squash merge**로 한다 (이슈 브랜치 → `integration`).

> 머지 이후는 전부 자동이다. `board.yml`이 카드를 `배포대기`로 옮기고 라벨을 바꾸며,
> `main` 배포 때 `release.yml`이 이슈를 닫는다. 사람이 보드를 손댈 일은 없다.
>
> 단 **`main`으로 가는 머지(배포)는 다르다.** 버전 3곳과 태그가 함께 가야 하고
> Merge commit이어야 하므로, 배포 절차([docs/workflow.md](docs/workflow.md))를 따른다.

### 급한 수정만 예외
운영 장애는 `integration`이 아니라 **`main`에서** `hotfix/<버전>`을 딴다. `integration`에는 아직 안 내보낼 기능이 섞여 있기 때문이다. `main` 머지 후 반드시 `integration`에 합친다.

---

## Commit Convention
형식: `type(scope): 한글 설명 + 평서 종결형 어미(~함/~음)`. 외부 파일을 참조하지 않는, 이 저장소의 단일 기준.
- **type**: `feat` `fix` `style` `refactor` `chore` `docs`
- **scope**: 변경 도메인·화면 (`home` `goal` `stats` `investment` `faq` `calendar` `layout` `navigation` 등)
- **예시**: `fix(stats): 손실 데이터가 차트에서 음수 영역으로 표시되도록 수정함`

### 이슈 연동 (필수)
이슈를 GitHub로 관리하므로, **모든 커밋 메시지 마지막 줄에 반드시 `Closes #N` 트레일러를 붙인다.** 전체 협업 흐름은 [docs/workflow.md](docs/workflow.md)가 기준이며, 여기는 커밋 규칙 요약이다.

- 형식: 제목(+본문) 뒤에 **빈 줄 하나**를 두고, 마지막 줄에 `Closes #N`
- **PR 본문이 아니라 커밋 메시지에 쓴다.** PR base가 `integration`이라 본문에 쓰면 단순 텍스트로만 남는다.
- 여러 이슈: `Closes #12, Closes #15`
- 커밋과 연결된 이슈가 없으면 커밋하지 않고 **먼저 이슈를 만든다.**
- 동작: squash로 `integration`에 머지되면 `board.yml`이 카드를 `배포대기`로 옮기고, `main` 배포 때 `release.yml`이 이슈를 닫는다. (즉시 닫히지 않음)
- 전체 예시:
  ```
  feat(goal): 목적 카드를 길게 눌러 순서를 바꾸는 기능을 추가함

  Closes #42
  ```
- 이슈는 `overcode-kitchen/torich-web` 레포에서, 진행 현황은 조직 프로젝트 보드(`overcode-kitchen/projects/2`)에서 관리한다.
- **로컬 강제 장치**: `commit-msg` husky 훅(`.husky/commit-msg`)이 트레일러 없는 커밋을 거부한다. `pnpm install` 시 자동 설치되며, 머지/리버트 커밋은 예외. 부득이할 때만 `git commit --no-verify`로 우회한다.

---

# 운영 컨텍스트 (반드시 인지)

코드 변경의 영향 반경을 판단하기 위해 항상 아래를 전제한다.

- iOS 앱은 Capacitor **로컬 번들** 방식 (`webDir: 'out'`, 정적 export).
- `main` 배포 시 **웹/서버는 즉시 반영되지만, 출시된 iOS 앱은 사용자가 업데이트해야 반영된다.**
- 클라이언트가 Supabase SDK로 **DB에 직접 접근** → **스키마가 곧 API**, 스키마 변경 = Breaking Change.
- 운영 중에는 항상 **`구버전 앱 + 신버전 DB/API`** 조합이 존재한다고 가정한다.
- 머지 기준: **"지금 운영 앱 사용자에게 안전한가?"**

---

# Supabase / API 호환성 (CRITICAL)

## Supabase 스키마 — Breaking Change 금지
- **금지**: 기존 컬럼 삭제·이름변경·타입변경 / 기존 컬럼에 `NOT NULL` 추가(기존 행 파괴) / RLS 강화(조회 범위 축소)
- **허용**: 새 컬럼 추가(`DEFAULT` 필수) / 새 테이블 / `NOT NULL`→`NULL` 완화 / 인덱스 추가
- **구조 변경 시 순서 고정**: ① 새 구조 추가(구 스펙 병행) → ② 앱 업데이트 배포 확인 → ③ 구 스펙 제거

## Next.js API Route — Breaking Change 금지
- **금지**: 기존 필드 삭제·이름변경·타입변경, 엔드포인트 경로/요청 형식 변경
- **허용**: 새 필드 추가, 새 엔드포인트 추가

## 마이그레이션
- 파일명은 **Supabase CLI 타임스탬프** 형식 (예: `20260426153000_add_market_to_records.sql`)
- 작성 후 반드시 타입 재생성: `supabase gen types typescript --project-id <ID> > types/database.types.ts`

---

# 빌드 함정

- **`build:app` 실패 복구**: 빌드 중 `app/api`·`app/auth`를 `server-routes.backup/`으로 임시 이동한다. 중간 실패 시 복구되지 않은 채 남으므로 발견 즉시 수동 복구:
  ```bash
  mv server-routes.backup/api app/api && mv server-routes.backup/auth app/auth && rm -rf server-routes.backup
  ```
- **`server.url`은 환경변수로만 설정한다**: 주석 해제된 `server.url`이 배포되면 운영 앱이 개발자 맥을 바라봐 전체 사용자가 앱을 못 쓴다. 그래서 `capacitor.config.ts`는 개발 주소를 **파일에 적지 않고** `CAP_SERVER_URL`로 받는다. 변수를 설정하지 않으면 `server: {}` + `loggingBehavior: 'production'`이 되므로, 파일에 개발 주소가 남아 커밋될 수 없다.
  - 실기기 라이브 리로드: `pnpm dev:app` (터미널 1) + `pnpm sync:app` (터미널 2). 맥의 LAN IP는 `scripts/lan-ip.sh`가 자동 감지한다.
  - `capacitor.config.ts`를 직접 고쳐 주소를 적는 방식은 쓰지 않는다.

## 앱 빌드 환경변수 — `.env.local`이 `.env.production`을 이긴다 (CRITICAL)

`NEXT_PUBLIC_*` 값은 **빌드 시점에 번들에 문자열로 구워진다.** 잘못된 값이 들어가면 배포 후 앱에서만 드러나고, 재빌드·재심사 외에는 되돌릴 방법이 없다.

Next의 우선순위는 아래와 같다. **위쪽이 이긴다.**

| 순위 | 출처 |
|---|---|
| 1 | 쉘 환경변수 (`FOO=bar pnpm build:app`) |
| 2 | `.env.production.local` |
| 3 | **`.env.local`** |
| 4 | `.env.production` |
| 5 | `.env` |

`.env.local`이 `.env.production`보다 **위**라는 게 핵심이다. `.env.production`에 운영 값을 넣어도, **같은 키가 `.env.local`에도 있으면 `.env.local`이 구워진다.** `.env.local`에 없는 키(예: GA ID)만 `.env.production` 값이 실제로 쓰인다.

`.env.local`의 `NEXT_PUBLIC_API_URL`은 로컬 개발용 `http://localhost:3000`으로 두는 게 보통이므로, 이 키가 정확히 위 함정에 해당한다.

### 릴리즈·심사 빌드는 쉘 환경변수로 넘긴다 (권장)

`.env.local`을 고쳤다 되돌리는 방식은 되돌리기를 잊는 순간 로컬 주소가 새어 나간다. 우선순위 1위인 쉘 환경변수를 쓰면 파일을 건드리지 않는다.

```bash
NEXT_PUBLIC_API_URL=https://torich.vercel.app pnpm build:app
```

`scripts/verify-app-build-env.mjs`가 빌드 전에 해석된 값과 **출처 파일**을 출력하고, 로컬 주소(`localhost`·루프백·사설 IP)면 빌드를 중단한다. 실기기 로컬 테스트 목적이라면 `ALLOW_LOCAL_API_URL=1`로만 우회한다.

빌드 후 번들을 직접 확인하는 게 최종 관문이다.

```bash
grep -ro "localhost:3000" out/ | wc -l   # 반드시 0
```

## macOS 한글 경로 + CocoaPods UTF-8

작업 경로에 한글이 포함되어 있을 경우 (예: `Team/overcord-kitchen/...`) `pod install` 단계에서 `Encoding::CompatibilityError` 가 발생한다. `~/.zshrc` 에 아래를 영구 등록한다.

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

---

# Capacitor 정적 Export 라우팅 정책 (CRITICAL)

iOS 앱은 `output: 'export'` 로 빌드한 정적 파일을 Capacitor WebView가 로드하는 구조이다. **빌드 시점에 prebuild되지 않은 경로는 운영 앱에서 404 → 루트 폴백으로 메인 화면 리다이렉트로 보인다.** 모든 페이지/네비게이션은 이 제약을 전제로 설계한다.

## 동적 세그먼트(`[param]`) 신규 추가 금지 (원칙)

- ❌ **금지**: `app/**/[id]/page.tsx`, `app/**/[slug]/page.tsx` 형태의 새 동적 세그먼트
- ✅ **권장**: 정적 경로 + `useSearchParams` 로 식별자 전달
  - 예: `/goal/detail?id=abc` (정적 1개 페이지로 모든 ID 처리)
  - ❌ `/goal/[id]` (모든 ID를 빌드 시점에 알 수 없으므로 사용 불가)

### 예외: 값 집합이 빌드 시점에 확정 가능한 경우만 허용
- 허용 예: `[locale]` (값이 `['ko','en']` 로 한정)
- 이 경우 반드시 `generateStaticParams` 로 모든 값을 명시한다.

### 동적 세그먼트가 꼭 필요할 때 — 분리 패턴 강제
페이지가 `'use client'` 인데 `generateStaticParams` 도 export 해야 한다면 두 파일로 분리한다 (`'use client'` 파일은 서버 export를 가질 수 없음).

```
app/foo/[id]/
  page.tsx          # 서버 컴포넌트, generateStaticParams + <FooClient/> 렌더만
  FooClient.tsx     # 'use client', 실제 로직
```

`dynamicParams = true` 는 `output: 'export'` 와 호환되지 않으므로 사용 금지.

## 페이지 신규 작성 시 라우팅 체크리스트

새 페이지를 만들 때 아래 순서로 자문한다.

1. URL에 식별자(id, slug 등)가 필요한가?
   - 필요 없음 → 정적 경로(`/foo`) 그대로 작성
   - 필요함 → 2번
2. 식별자 값 집합을 빌드 시점에 모두 알 수 있는가?
   - YES → `[param]` + `generateStaticParams` 로 전체 명시
   - NO → **반드시 정적 경로 + query param 패턴** (`/foo/detail?id=xxx`)
3. `router.push` / `router.replace` / `<Link>` 의 모든 대상 경로가 빌드 산출물(`out/`)에 존재하는지 확인 ( `pnpm build:app` 후 `ls out/` 검증)

## 기존 동적 라우트를 query param으로 전환할 때

이미 운영 앱에 박힌 deeplink/푸시 페이로드가 구 경로(`/goal/[id]`)를 가리킬 수 있으므로, 라우팅 변경은 **운영 컨텍스트 섹션의 "구버전 앱 + 신버전 API" 원칙**을 그대로 따른다. 필요 시 client-side에서 구 경로 → 신 경로로 redirect 하는 처리 추가.

## 머지 전 라우팅 점검 체크리스트

- [ ] 새로 추가/수정한 페이지가 `app/**/[*]/` 형태인가? → 정적 경로 + query param으로 대체 가능한지 재검토
- [ ] `pnpm build:app` 산출물 `out/` 에 모든 진입 경로의 HTML이 존재하는가
- [ ] `server-routes.backup/` 폴더가 워킹 트리에 남아 있지 않은가
- [ ] `git status` 에 `app/api/*`, `app/auth/*` 가 deleted로 떠 있지 않은가
- [ ] `capacitor.config.ts` 의 `server.url` 이 주석 처리 + `loggingBehavior: 'production'` 인가
- [ ] `grep -ro "localhost:3000" out/ | wc -l` 이 **0** 인가 (아카이빙 직전 필수)
- [ ] `[build:app] NEXT_PUBLIC_API_URL = ...` 출력의 값과 출처가 운영 기준으로 찍혔는가

---

# Edge Function 배포

`supabase/functions/`의 함수는 코드 변경 후 **별도 배포**로 반영된다. 함수 변경이 포함된 작업은 배포까지 끝내야 완료다.
→ `supabase functions deploy <함수명>`

---

# 상세 문서 (작업 시 필독)

긴 상세 규칙은 아래로 분리했다. 해당 작업을 할 때 반드시 읽는다.

- **[docs/architecture.md](docs/architecture.md)** — 파일 구조·네이밍·커스텀 훅 패턴·파일 크기 규칙·새 페이지/리팩터링 순서. *(페이지 생성·구조 변경 시 필독)*
- **[docs/design-system.md](docs/design-system.md)** — 디자인 바이브·컬러 3-Layer·다크모드·차트 색·shadcn·아이콘·이미지 변환 워크플로우. *(UI 작업 시 필독)*
- **[docs/coding-style.md](docs/coding-style.md)** — 기술 스택 제약·코딩 스타일·경로/컴포넌트 규칙·한국어 처리.

---

# 디자인 규칙 (Design Rules)

> 토큰 정본은 [docs/design-system/02-TOKENS.md](docs/design-system/02-TOKENS.md), 전체 규칙은 [docs/design-system/03-RULES.md](docs/design-system/03-RULES.md). 아래는 UI를 만들 때 반드시 지키는 요약이다. 단정형으로 못박는다.

- **색**: 정의된 시맨틱 토큰만 쓴다(`bg-card` `text-foreground` `text-muted-foreground` `bg-primary` `text-success` 등). 임의 hex/`rgb()`/`hsl()`·`bg-white`·`text-black`을 직접 쓰지 않는다. 그라디언트는 페이드 마스크와 토큰화된 브랜드 패널(`--goal-well`)만 허용한다. 한 화면에 primary(브랜드 그린) 버튼은 1개다.
- **글자**: 스케일 토큰만 쓴다 — `text-caption`(12) `text-label`(14) `text-body`(16) `text-heading`(20) `text-title`(24) `text-display`(30), 랜딩만 `text-display-lg`. 임의 px(`text-[11px]` 등) 금지. 본문 기본은 `text-body`. 굵기는 `font-medium`·`font-semibold`·`font-bold` 3종만 명시한다(본문은 미지정).
- **간격**: 4배수 스텝(`1 2 3 4 6 8 12`)만 쓴다. 하프스텝은 칩/작은 버튼의 `1.5`·`2.5`만 예외다. 내부 `p-3~p-4` / 사이 `gap-2~gap-3` / 섹션 사이 `gap-6~gap-8`.
- **컴포넌트**: 만들기 전 `components/ui`·`app/components`에 같은 역할이 있는지 확인한다. 버튼은 `<Button>`, 카드는 `<Card>`를 쓴다. 화면/섹션 파일에 `rounded-2xl bg-card` 같은 껍데기나 raw `<button>` 스타일을 인라인·복붙하지 않는다.
- **레이아웃**: 모바일 우선(`md:` 이상에서 확장), 콘텐츠 최대 폭 제한.
- **작업 후 자가 점검**: 임의 hex·`text-[..px]`·`bg-white` 없음 / 폰트 6단·굵기 3종 이내 / 간격 4배수 / `<Button>`·`<Card>` 사용 / primary 버튼 1개 / 라이트·다크 대비 유지 / `globals.css` 변경 시 `app/design-system` 갱신.

### 이 규칙은 자동으로 강제된다 (기억이 아니라 가드)

위 색·글자·간격 규칙은 **검사기가 막는다.** `pre-commit` 훅과 CI가 `pnpm run lint:design`을 돌리며, 어기면 **커밋이 되지 않는다.** 자세한 내용은 [docs/design-system/04-GUARD.md](docs/design-system/04-GUARD.md).

- 직접 돌려보기: `pnpm run lint:design` (전체 0.2초) · 부채까지 보려면 `--strict`
- **정당한 예외**는 두 방법으로만 등록한다 — 각 `scripts/check-hardcoded-*.mjs` 상단의 `ALLOWLIST`, 또는 해당 줄 위 `// design-guard-disable-next-line <rule> — 이유`. **이유를 안 쓰면 예외가 걸리지 않는다.**
- 기존 부채(임의 폰트 34건)는 파일별로 **동결**돼 있다. 그 숫자는 **내려가기만 한다** — 늘리는 변경은 막힌다.
